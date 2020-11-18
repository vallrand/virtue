import {Equation} from './equation'
import {vec3} from '../math/vec3'

const FrictionEquation = _ => Object.setPrototypeOf(Object.assign(Equation(), {
    contactTangent: vec3(),
    contactPointA: vec3(),
    contactPointB: vec3()
}), FrictionEquation.prototype)

FrictionEquation.prototype = Object.setPrototypeOf({
    computeRightHandSide: function(deltaTime){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              contactPointA = this.contactPointA,
              contactPointB = this.contactPointB,
              contactTangent = this.contactTangent,
              spatialA = this.jacobianElementA.spatial,
              spatialB = this.jacobianElementB.spatial,
              angularA = this.jacobianElementA.angular,
              angularB = this.jacobianElementB.angular
        vec3.copy(contactTangent, spatialB)
        vec3.negate(contactTangent, spatialA)
        vec3.cross(contactPointB, spatialB, angularB)
        vec3.cross(contactPointA, spatialA, angularA)
        const GW = this.computeBodyVelocities(),
              GiMf = this.computeGiMf()
        return - GW * this.b - deltaTime * GiMf
    }
}, Equation.prototype)

export {FrictionEquation}
