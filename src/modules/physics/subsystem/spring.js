import {vec3} from '../math/vec3'
import {aquireVec3Pool} from '../math'
import {Transform} from '../math/transform'

const Spring = (bodyA, bodyB, options) => {
    options = Object.assign({
        restLength: 1,
        stiffness: 100,
        damping: 1
    }, options || {})
    
    const localAnchorA = vec3.copy(options.localAnchorA || vec3())
    const localAnchorB = vec3.copy(options.localAnchorB || vec3())
    if(options.worldAnchorA)
        Transform.pointToLocalFrame(options.worldAnchorA, bodyA.position, bodyA.quaternion, localAnchorA)
    if(options.worldAnchorB)
        Transform.pointToLocalFrame(options.worldAnchorB, bodyB.position, bodyB.quaternion, localAnchorB)
    return {
        update: _ => {
            const vec3Pool = aquireVec3Pool(),
                  damping = options.damping,
                  stiffness = options.stiffness,
                  restLength = options.restLength,
                  temp = vec3Pool.obtain()
            
            const offsetA = Transform.pointToWorldFrame(localAnchorA, bodyA.position, bodyA.quaternion, vec3Pool.obtain())
            const offsetB = Transform.pointToWorldFrame(localAnchorB, bodyB.position, bodyB.quaternion, vec3Pool.obtain())
            
            const direction = vec3.subtract(offsetB, offsetA, vec3Pool.obtain())
            const distance = vec3.distance(direction)
            vec3.normalize(direction, direction)
            
            vec3.subtract(offsetA, bodyA.position, offsetA)
            vec3.subtract(offsetB, bodyB.position, offsetB)
            
            const relativeVelocity = vec3.subtract(bodyB.velocity, bodyA.velocity, vec3Pool.obtain())
            
            vec3.cross(bodyB.angularVelocity, offsetB, temp)
            vec3.add(relativeVelocity, temp, relativeVelocity)
            vec3.cross(bodyA.angularVelocity, offsetA, temp)
            vec3.subtract(relativeVelocity, temp, relativeVelocity)
            
            vec3.scale(direction, -stiffness*(distance - restLength) - damping * vec3.dot(relativeVelocity, direction), direction)
            
            vec3.subtract(bodyA.force, direction, bodyA.force)
            vec3.add(bodyB.force, direction, bodyB.force)
            
            vec3.cross(offsetA, direction, temp)
            vec3.subtract(bodyA.torque, temp, bodyA.torque)
            vec3.cross(offsetB, direction, temp)
            vec3.add(bodyB.torque, temp, bodyB.torque)
            
            vec3Pool.release()
        }
    }
}

export {Spring}