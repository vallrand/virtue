import {vec3} from '../math/vec3'
import {aquireVec3Pool} from '../math'

const SmoothedParticleHydrodynamicsSystem = options => {
    options = Object.assign({
        density: 1,
        smoothingRadius: 1,
        speedOfSound: 1,
        viscosity: 0.01,
        epsilon: 0.000001
    }, options || {})
    const particles = [],
          pressures = [],
          densities = [],
          neighbors = []
    
    const computeWeight = radius => { //TODO most values can be precomputed and cached
        const smoothingRadius = options.smoothingRadius
        return 315.0 / (64.0 * Math.PI * Math.pow(smoothingRadius, 9)) * 
            Math.pow(smoothingRadius * smoothingRadius - radius * radius, 3)
    }
    const computeWeightGradient = (radiusVector, out = vec3()) => {
        const smoothingRadius = options.smoothingRadius,
              radius = vec3.distance(radiusVector)
        return vec3.scale(radiusVector, 945.0 / (32.0 * Math.PI * Math.pow(smoothingRadius, 9)) * 
                          Math.pow((smoothingRadius * smoothingRadius - radius * radius), 2), out)
    }
    const computeNabla = radius => {
        const smoothingRadius = options.smoothingRadius,
              radiusSquared = radius*radius
        return 945.0 / (32.0 * Math.PI * Math.pow(smoothingRadius, 9)) * 
            (smoothingRadius * smoothingRadius - radiusSquared) * (7 * radiusSquared - 3 * smoothingRadius * smoothingRadius)
    }
    
    return {
        add: particle => {
            particles.push(particle)
            neighbors.push([])
        },
        remove: particle => {
            let idx = particles.indexOf(particle)
            if(idx == -1) return false
            particles.splice(idx, 1)
            neighbors.pop()
        },
        update: _ => {
            const vec3Pool = aquireVec3Pool(),
                  radiusSquared = options.smoothingRadius * options.smoothingRadius,
                  speedSquared = options.speedOfSound * options.speedOfSound,
                  epsilon = options.epsilon
            
            for(let i = 0; i < particles.length; i++){
                let particle = particles[i],
                    position = particle.position,
                    neighborList = neighbors[i],
                    totalDensity = 0
                neighborList.length = 0
                
                for(let j = 0; j < particles.length; j++){
                    let neighbor = particles[j],
                        distanceSquared = vec3.differenceSquared(position, neighbor.position)
                    if(distanceSquared >= radiusSquared) continue
                    neighborList.push(neighbor)
                    let distance = Math.sqrt(distanceSquared),
                        weight = computeWeight(distance)
                    totalDensity += neighbor.mass * weight
                }
                densities[i] = totalDensity
                pressures[i] = speedSquared * (totalDensity - options.density)
            }
            
            const pressure = vec3Pool.obtain(),
                  viscosity = vec3Pool.obtain(),
                  difference = vec3Pool.obtain(),
                  weightGradient = vec3Pool.obtain()
            
            for(let i = 0; i < particles.length; i++){
                let particle = particles[i],
                    neighborList = neighbors[i],
                    force = particle.force
                
                vec3.copy(vec3.ZERO, pressure)
                vec3.copy(vec3.ZERO, viscosity)
                
                for(let j = 0; j < neighborList.length; j++){
                    let neighbor = neighborList[j]
                    vec3.subtract(particle.position, neighbor.position, difference)
                    let radius = vec3.distance(difference), //TODO cache from prev loop
                        pressureContribution = -neighbor.mass * (pressures[i] / (densities[i] * densities[i] + epsilon) + 
                                                                 pressures[j] / (densities[j] * densities[j] + epsilon))
                    computeWeightGradient(difference, weightGradient)
                    vec3.scale(weightGradient, pressureContribution, weightGradient)
                    vec3.add(pressure, weightGradient, pressure)
                    
                    vec3.subtract(neighbor.velocity, particle.velocity, difference)
                    let viscosityContribution = options.viscosity * neighbor.mass * 1.0 / (0.0001 + densities[i] * densities[j])
                    vec3.scale(difference, viscosityContribution, difference)
                    let nabla = computeNabla(radius)
                    vec3.scale(difference, nabla, difference)
                    vec3.add(viscosity, difference, viscosity)                    
                }
                
                vec3.scale(pressure, particle.mass, pressure)
                vec3.scale(viscosity, particle.mass, viscosity)
                vec3.add(force, viscosity, force)
                vec3.add(force, pressure, force)
            }
            
            vec3Pool.release()
        }
    }
}

export {SmoothedParticleHydrodynamicsSystem}