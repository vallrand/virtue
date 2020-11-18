import {vec3} from '../math/vec3'
import {Transform} from '../math/transform'
import {RotationalEquation} from '../equation/rotationalEquation'
import {PointToPointConstraint} from './pointToPointConstraint'

const LockConstraint = (bodyA, bodyB, options = {}) => {
    options.pivotA = vec3()
    options.pivotB = vec3()
    const middle = vec3.add(bodyA.position, bodyB.position)
    vec3.scale(middle, 0.5, middle)
    Transform.pointToLocalFrame(middle, bodyA.position, bodyA.quaternion, options.pivotA)
    Transform.pointToLocalFrame(middle, bodyB.position, bodyB.quaternion, options.pivotB)
    
    const constraint = PointToPointConstraint(bodyA, bodyB, options)

    const initialXUnitA = Transform.vectorToLocalFrame(vec3.AXIS_X, bodyA.position, bodyA.quaternion),
          initialXUnitB = Transform.vectorToLocalFrame(vec3.AXIS_X, bodyB.position, bodyB.quaternion),
          initialYUnitA = Transform.vectorToLocalFrame(vec3.AXIS_Y, bodyA.position, bodyA.quaternion),
          initialYUnitB = Transform.vectorToLocalFrame(vec3.AXIS_Y, bodyB.position, bodyB.quaternion),
          initialZUnitA = Transform.vectorToLocalFrame(vec3.AXIS_Z, bodyA.position, bodyA.quaternion),
          initialZUnitB = Transform.vectorToLocalFrame(vec3.AXIS_Z, bodyB.position, bodyB.quaternion)
    const rotationalEquationX = RotationalEquation(),
          rotationalEquationY = RotationalEquation(),
          rotationalEquationZ = RotationalEquation()
    rotationalEquationX.bodyA = rotationalEquationY.bodyA = rotationalEquationZ.bodyA = bodyA
    rotationalEquationX.bodyB = rotationalEquationY.bodyB = rotationalEquationZ.bodyB = bodyB
    
    constraint.equations.push(rotationalEquationX, rotationalEquationY, rotationalEquationZ)
    
    return Object.assign(constraint, {
        update: (base => _ => {
            const bodyA = constraint.bodyA,
                  bodyB = constraint.bodyB
            
            Transform.vectorToWorldFrame(initialXUnitA, bodyA.position, bodyA.quaternion, rotationalEquationX.axisA)
            Transform.vectorToWorldFrame(initialYUnitB, bodyB.position, bodyB.quaternion, rotationalEquationX.axisB)
            
            Transform.vectorToWorldFrame(initialYUnitA, bodyA.position, bodyA.quaternion, rotationalEquationY.axisA)
            Transform.vectorToWorldFrame(initialZUnitB, bodyB.position, bodyB.quaternion, rotationalEquationY.axisB)
            
            Transform.vectorToWorldFrame(initialZUnitA, bodyA.position, bodyA.quaternion, rotationalEquationZ.axisA)
            Transform.vectorToWorldFrame(initialXUnitB, bodyB.position, bodyB.quaternion, rotationalEquationZ.axisB)
            
            return base()
        })(constraint.update)
    })
}

export {LockConstraint}