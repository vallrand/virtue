import {factory, tie, Stream, genRandomFloat} from '../util'
import {vec2, vec3, quat, mat4} from '../math'

const Boid = options => {
    const target = Object.create(null),
          position = vec3.copy(options.position || vec3.ZERO),
          rotation = quat(),
          velocity = vec3(),
          steeringForce = vec3(),
          velocitySamples = [],
          smoothingSampleCount = options.smoothingSampleCount || 20
    let maxSpeed = options.maxSpeed || 1e-2,
        maxForce = options.maxForce || 1e-5,
        mass = options.mass || 1.0,
        wanderAngle = 0
    
    return tie(target, {
        get position(){ return position },
        get rotation(){ return rotation },
        get velocity(){ return velocity },
        update: deltaTime => {
            target.verlet(deltaTime)
            
            if(velocitySamples.length === smoothingSampleCount) velocitySamples.shift()
            velocitySamples.push(velocity)
            const totalVelocity = velocitySamples.reduce((total, v) => vec3.add(total, v, total), vec3())
            vec3.normalize(totalVelocity, totalVelocity)
            if(!vec3.equals(vec3.ZERO, totalVelocity))
                quat.normalize(quat.fromMat4(mat4.targetTo(vec3.ZERO, totalVelocity, vec3.AXIS_Y)), rotation)
        },
        verlet: deltaTime => {
            vec3.truncate(steeringForce, maxForce, steeringForce)
            vec3.scale(steeringForce, 1 / mass, steeringForce)
            vec3.add(velocity, steeringForce, velocity)
            vec3.copy(vec3.ZERO, steeringForce)
            
            vec3.truncate(velocity, maxSpeed, velocity)
            vec3.add(position, velocity, position)
        },
        seek: (objective, arrivalThreshold = 0) => {
            const desiredVelocity = vec3.subtract(objective, position),
                  distance = vec3.distance(desiredVelocity)
            vec3.scale(desiredVelocity, (distance ? 1/distance : 0) * (distance > arrivalThreshold ? maxSpeed : maxSpeed * distance / arrivalThreshold), desiredVelocity)
            vec3.subtract(desiredVelocity, velocity, desiredVelocity)
            vec3.add(steeringForce, desiredVelocity, steeringForce)
        },
        flee: objective => {
            const desiredVelocity = vec3.subtract(objective, position),
                  distance = vec3.distance(desiredVelocity)
            vec3.scale(desiredVelocity, (distance ? 1/distance : 0) * maxSpeed, desiredVelocity)
            vec3.subtract(desiredVelocity, velocity, desiredVelocity)
            vec3.subtract(steeringForce, desiredVelocity, steeringForce)
        },
        wander: (wanderDistance = 0.1, wanderRange = Math.PI * 0.05) => {
            const center = vec3.normalize(velocity)
            vec3.scale(center, wanderDistance, center)         
            const offset = vec3(Math.sin(wanderAngle) * wanderDistance, 0, Math.cos(wanderAngle) * wanderDistance)
            wanderAngle += genRandomFloat(-0.5 * wanderRange, 0.5 * wanderRange)
            vec3.add(center, offset, center)
            vec3.add(steeringForce, center, steeringForce)
        },
        pursue: objective => {
            const distanceAhead = vec3.distance(vec3.subtract(objective.position, position)) / maxSpeed
            const futureObjective = vec3.add(objective.position, vec3.scale(vec3.normalize(objective.velocity), distanceAhead))
            target.seek(futureObjective)
        },
        evade: objective => {
            const distanceAhead = vec3.distance(vec3.subtract(objective.position, position)) / maxSpeed
            const futureObjective = vec3.subtract(objective.position, vec3.scale(vec3.normalize(objective.velocity), distanceAhead))
            target.flee(futureObjective)
        },
        //TODO entity format etc
//        interpose: (left, right) => {
//            const middle = vec3.scale(vec3.add(left.position, right.position), 0.5)
//            const objectiveTime = vec3.distance(vec3.subtract(position, middle)) / maxSpeed
//            const futureLeft = vec3.add(left.position, vec3.scale(left.velocity, objectiveTime))
//            const futureRight = vec3.add(right.position, vec3.scale(right.velocity, objectiveTime))
//            vec3.scale(vec3.add(futureLeft, futureRight), 0.5, middle)
//            target.seek(middle)
//        },
//        separation: (entities, separationRadius = 300, maxSeparation = 100) => {
//            const force = vec3(),
//                  distance = vec3()
//            let neighborCount = 0,
//                entityIdx = entities.length,
//                entity = null
//            while(entityIdx--){
//                entity = entities[entityIdx]
//                if(entity === target) continue
//                vec3.subtract(entity.position, position, distance)
//                if(vec3.distance(distance) > separationRadius) continue
//                vec3.add(force, distance, force)
//                neighborCount++
//            }
//            //if(neighborCount != 0) vec3.scale(force, -1/neighborCount, force) //TODO: remove - Not required
//            vec3.normalize(force, force)
//            vec3.scale(force, -maxSeparation, force)
//            vec3.add(steeringForce, force, steeringForce)
//        },
        followPath: (pathIdx, path, loop, thresholdRadius = 1) => {
            const wayPoint = path[pathIdx]
            if(vec3.distance(vec3.subtract(position, wayPoint)) < thresholdRadius)
                pathIdx = pathIdx >= path.length - 1 ? (loop ? 0 : pathIdx) : ++pathIdx
            target.seek(wayPoint, pathIdx == path.length - 1 && !loop ? 2 * thresholdRadius : 0)
            return pathIdx
        },
//        avoid: (entities) => {
//            let avoidDistance = 100
//            
//            const speed = vec3.distance(velocity),
//                  direction = vec3.scale(velocity, speed ? 1/speed : 0)
//            const ahead = vec3.add(position, vec3.scale(direction, speed / maxSpeed)),
//                  halfAhead = vec3.add(position, vec3.scale(direction, avoidDistance * 0.5))
//            let closest = null,
//                entityIdx = entities.length,
//                entity = null
//            while(entityIdx--){
//                entity = entities[entityIdx]
//                if(entity === target) continue
//                //TODO more precise calculation with distance to vector instead
//                const collision = vec3.distance(vec3.subtract(entity.position, ahead)) <= entity.radius || vec3.distance(vec3.subtract(entity.position, halfAhead)) <= entity.radius
//                if(collision && (closest == null || vec3.distance(vec3.subtract(position, entity.position)) < vec3.distance(vec3.subtract(position, closest.position))))//TODO cache distance
//                    closest = entity
//            }
//            const avoidance = closest ? vec3.scale(vec3.normalize(vec3.subtract(ahead, closest.position)), 100) : vec3() //TODO remoe hardcoded values
//            vec3.add(steeringForce, avoidance, steeringForce)
//        },
//        inSight: entity => {
//            let inSightDistance = 5000
//            if(vec3.distance(vec3.subtract(position, entity.position)) > inSightDistance) return false //TODO optimise
//            const heading = vec3.normalize(velocity)
//            const difference = vec3.subtract(entity.position, position)
//            return vec3.dot(difference, heading) >= 0
//        },
//        flock: (entities) => {
//            let tooCloseDistance = 100
//            
//            const averageVelocity = vec3.copy(velocity)
//            const averagePosition = vec3()
//            let inSightCount = 0
//            for(let i = 0; i < entities.length; i++)
//                if(entities[i] !== target && target.inSight(entities[i])){
//                    vec3.add(averageVelocity, entities[i].velocity, averageVelocity)
//                    vec3.add(averagePosition, entities[i].position, averagePosition)
//                    if(vec3.distance(vec3.subtract(position, entities[i].position)) < tooCloseDistance)
//                        target.flee(entities[i].position)
//                    inSightCount++
//                }
//            if(inSightCount > 0){
//                vec3.scale(averageVelocity, 1/inSightCount, averageVelocity)
//                vec3.scale(averagePosition, 1/inSightCount, averagePosition)
//                target.seek(averagePosition)
//                vec3.add(steeringForce, averageVelocity, steeringForce)
//            }
//        }
    })
}

export {Boid}