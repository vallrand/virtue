import {tie, factory} from '../../util'
import {vec3, quat, aquireVec3Pool} from '../math'

const integrate = (body, deltaTime, quaternionNormalization) => {
    if(!body.dynamic) return false
    
    const position = body.position,
          quaternion = body.quaternion,
          velocity = body.velocity,
          angularVelocity = body.angularVelocity,
          force = body.force,
          torque = body.torque,
          linearFactor = body.linearFactor,
          angularFactor = body.angularFactor,
          invInertia = body.invInertiaWorld,
          invTimeMass = body.invMass * deltaTime
    
    vec3.copy(position, body.previousPosition)
    vec3.copy(quaternion, body.previousQuaternion)
    
    velocity[0] += force[0] * linearFactor[0] * invTimeMass
    velocity[1] += force[1] * linearFactor[1] * invTimeMass
    velocity[2] += force[2] * linearFactor[2] * invTimeMass
    
    const rqx = torque[0] * angularFactor[0],
          rqy = torque[1] * angularFactor[1],
          rqz = torque[2] * angularFactor[2] //TODO use mat3 and vec3 functions?
    angularVelocity[0] += deltaTime * (invInertia[0] * rqx + invInertia[1] * rqy + invInertia[2] * rqz)
    angularVelocity[1] += deltaTime * (invInertia[3] * rqx + invInertia[4] * rqy + invInertia[5] * rqz)
    angularVelocity[2] += deltaTime * (invInertia[6] * rqx + invInertia[7] * rqy + invInertia[8] * rqz)
    
    position[0] += velocity[0] * deltaTime
    position[1] += velocity[1] * deltaTime
    position[2] += velocity[2] * deltaTime
    
    const ax = angularVelocity[0] * angularFactor[0],
          ay = angularVelocity[1] * angularFactor[1],
          az = angularVelocity[2] * angularFactor[2],
          halfDeltaTime = 0.5 * deltaTime,
          qx = quaternion[0],
          qy = quaternion[1],
          qz = quaternion[2],
          qw = quaternion[3]
    quaternion[0] += halfDeltaTime * (ax * qw + ay * qz - az * qy)
    quaternion[1] += halfDeltaTime * (ay * qw + az * qx - ax * qz)
    quaternion[2] += halfDeltaTime * (az * qw + ax * qy - ay * qx)
    quaternion[3] += halfDeltaTime * (- ax * qx - ay * qy - az * qz)

    if(quaternionNormalization)
        quaternionNormalization(quaternion, quaternion)
        
    body.worldAABB.dirty = true
    if(body.invInertia[0] != body.invInertia[1] || body.invInertia[0] != body.invInertia[2]) //TODO compare with precision //Math.abs() < EPSILON
        body.cachedInvInertiaWorld.dirty = true
}

factory.declare('physics', (target, options) => {
    options = Object.assign({
        normalizationFrequency: 1,
        normalizationFunction: quat.normalize
    }, options || {})
    const gravity = vec3.copy(options.gravity || vec3())
    
    target.addEventListener('preStep', event => { //TODO abstract gravity into one of 'world forces'
        for(let i = target.bodies.length - 1; i >= 0; i--){
            const body = target.bodies[i]
            if(!body.dynamic) continue
            const mass = body.mass,
                force = body.force
            force[0] += mass * gravity[0]
            force[1] += mass * gravity[1]
            force[2] += mass * gravity[2]
        }
    })
    //TODO move to separate function - applyDamping(body)
    target.addEventListener('preIntegrate', event => {
        for(let i = target.bodies.length - 1; i >= 0; i--){
            let body = target.bodies[i]
            if(!body.dynamic) continue
            let linearDamping = Math.pow(1.0 - body.linearDamping, event.deltaTime)
            let velocity = body.velocity
            vec3.scale(velocity, linearDamping, velocity)
            let angularVelocity = body.angularVelocity
            if(!angularVelocity) continue
            let angularDamping = Math.pow(1.0 - body.angularDamping, event.deltaTime)
            vec3.scale(angularVelocity, angularDamping, angularVelocity)
        }    
    })
    
    return {
        gravity, //TODO have gravity as force with area of effect?
        integrate: event => {
            const quaternionNormalization = event.frame % (options.normalizationFrequency) ? null : options.normalizationFunction

            for(let i = target.bodies.length - 1; i >= 0; i--){
                let body = target.bodies[i]
                integrate(body, event.deltaTime, quaternionNormalization)
                vec3.copy(vec3.ZERO, body.force)
                vec3.copy(vec3.ZERO, body.torque)
            }
        }
    }
})