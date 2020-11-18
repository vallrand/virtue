import {vec3} from '../math/vec3'
import {Constraint} from './constraint'
import {ContactEquation} from '../equation/contactEquation'

const DistanceConstraint = (bodyA, bodyB, options = {}) => {
    const constraint = Constraint(bodyA, bodyB, options),
          equation = ContactEquation()
    equation.bodyA = bodyA
    equation.bodyB = bodyB
    equation.minForce = -(options.maxForce || 1e6)
    equation.maxForce = options.maxForce || 1e6
    
    constraint.equations.push(equation)
    
    return Object.assign(constraint, {
        distance: options.distance || vec3.difference(bodyA.position, bodyB.position),
        update: _ => {
            const normal = equation.contactNormal,
                  halfDistance = 0.5 * constraint.distance
            vec3.subtract(constraint.bodyB.position, constraint.bodyA.position, normal)
            vec3.normalize(normal, normal)
            vec3.scale(normal, halfDistance, equation.contactPointA)
            vec3.scale(normal, -halfDistance, equation.contactPointB)
        }
    })
}

export {DistanceConstraint}