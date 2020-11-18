import {vec3} from '../math/vec3'
import {ContactEquation} from '../equation/contactEquation'
import {Constraint} from './constraint'

const PointToPointConstraint = (bodyA, bodyB, options = {}) => {    
    const constraint = Constraint(bodyA, bodyB, options),
          equationX = ContactEquation(),
          equationY = ContactEquation(),
          equationZ = ContactEquation()
    
    equationX.bodyA = equationY.bodyA = equationZ.bodyA = bodyA
    equationX.bodyB = equationY.bodyB = equationZ.bodyB = bodyB
    equationX.minForce = equationY.minForce = equationZ.minForce = -(options.maxForce || 1e6)
    equationX.maxForce = equationY.maxForce = equationZ.maxForce = options.maxForce || 1e6
    vec3.copy(vec3.AXIS_X, equationX.contactNormal)
    vec3.copy(vec3.AXIS_Y, equationY.contactNormal)
    vec3.copy(vec3.AXIS_Z, equationZ.contactNormal)
    
    const pivotA = vec3.copy(options.pivotA || vec3()),
          pivotB = vec3.copy(options.pivotB || vec3())
    
    constraint.equations.push(equationX, equationY, equationZ)
    
    return Object.assign(constraint, {
        update: _ => {
            vec3.transformQuat(pivotA, constraint.bodyA.quaternion, equationX.contactPointA)
            vec3.transformQuat(pivotB, constraint.bodyB.quaternion, equationX.contactPointB)
            vec3.copy(equationX.contactPointA, equationY.contactPointA)
            vec3.copy(equationX.contactPointB, equationY.contactPointB)
            vec3.copy(equationX.contactPointA, equationZ.contactPointA)
            vec3.copy(equationX.contactPointB, equationZ.contactPointB) //TODO link to one object?
        }
    })
}

export {PointToPointConstraint}