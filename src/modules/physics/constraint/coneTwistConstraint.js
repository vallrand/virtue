import {vec3, Transform} from '../math'
import {RotationalEquation} from '../equation'
import {PointToPointConstraint} from './pointToPointConstraint'

const ConeTwistConstraint = (bodyA, bodyB, options = {}) => {
    options.collisionResponse = !!options.collisionResponse
    const constraint = PointToPointConstraint(bodyA, bodyB, options)
    const axisA = vec3.copy(options.axisA || vec3())
    const axisB = vec3.copy(options.axisB || vec3())
    
    const coneEquation = RotationalEquation()
    const twistEquation = RotationalEquation()
    coneEquation.bodyA = twistEquation.bodyA = bodyA
    coneEquation.bodyB = twistEquation.bodyB = bodyB
    coneEquation.maxForce = twistEquation.maxForce = 0
    coneEquation.minForce = twistEquation.minForce = -(options.maxForce || 1e6)
    
    constraint.equations.push(coneEquation, twistEquation)
    
    return Object.assign(constraint, {
        angle: options.angle || 0.0,
        twistAngle: options.twistAngle || 0.0,
        update: (base => _ => {
            const bodyA = constraint.bodyA,
                  bodyB = constraint.bodyB

            vec3.extractTangents(axisA, coneEquation.axisA, twistEquation.axisA)
            Transform.vectorToWorldFrame(twistEquation.axisA, bodyA.position, bodyA.quaternion, twistEquation.axisA)

            vec3.extractTangents(axisB, coneEquation.axisB, twistEquation.axisB)
            Transform.vectorToWorldFrame(twistEquation.axisB, bodyB.position, bodyB.quaternion, twistEquation.axisB)
            
            Transform.vectorToWorldFrame(axisA, bodyA.position, bodyA.quaternion, coneEquation.axisA)
            Transform.vectorToWorldFrame(axisB, bodyB.position, bodyB.quaternion, coneEquation.axisB)
            
            coneEquation.maxAngle = constraint.angle
            twistEquation.maxAngle = constraint.twistAngle
            
            return base()
        })(constraint.update)
    })
}

export {ConeTwistConstraint}