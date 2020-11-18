import {vec3} from '../math/vec3'
import {RotationalEquation} from '../equation/rotationalEquation'
import {RotationalMotorEquation} from '../equation/rotationalMotorEquation'
import {PointToPointConstraint} from './pointToPointConstraint'

const HingeConstraint = (bodyA, bodyB, options = {}) => {
    const constraint = PointToPointConstraint(bodyA, bodyB, options)

    const equationA = RotationalEquation(),
          equationB = RotationalEquation(),
          motorEquation = RotationalMotorEquation()
    equationA.bodyA = equationB.bodyA = motorEquation.bodyA = bodyA
    equationA.bodyB = equationB.bodyB = motorEquation.bodyB = bodyB
    motorEquation.enabled = false
    motorEquation.maxForce = options.maxForce || 1e6
    motorEquation.minForce = -(options.maxForce || 1e6)
    
    let axisA = vec3.copy(options.axisA || vec3.AXIS_X),
        axisB = vec3.copy(options.axisB || vec3.AXIS_X)
    
    constraint.equations.push(equationA, equationB, motorEquation)
    
    return Object.assign(constraint, {
        //enableMotor: value => motorEquation.enabled = value //TODO change API
        enableMotor: _ => motorEquation.enabled = true,
        disableMotor: _ => motorEquation.enabled = false,
        setMotorSpeed: value => motorEquation.targetVelocity = value,
        setMotorMaxForce: value => {
            motorEquation.maxForce = value
            motorEquation.minForce = -value
        },
        update: (base => _ => {
            const bodyA = constraint.bodyA,
                  bodyB = constraint.bodyB
            
            vec3.transformQuat(axisA, bodyA.quaternion, motorEquation.axisA)
            vec3.transformQuat(axisB, bodyB.quaternion, motorEquation.axisB)
            
            vec3.extractTangents(motorEquation.axisA, equationA.axisA, equationB.axisA)
            vec3.copy(motorEquation.axisB, equationA.axisB)
            vec3.copy(motorEquation.axisB, equationB.axisB)
            
            return base()
        })(constraint.update)
    })
}

export {HingeConstraint}