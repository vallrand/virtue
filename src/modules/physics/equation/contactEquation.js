import {Equation} from './equation'
import {vec3} from '../math/vec3'

const ContactEquation = _ => Object.setPrototypeOf(Object.assign(Equation(), {
    contactNormal: vec3(),
    contactPointA: vec3(),
    contactPointB: vec3(),
    minForce: 0,
    maxForce: 1e6,
    restitution: 0.0
}), ContactEquation.prototype)

ContactEquation.prototype = Object.setPrototypeOf({
    computeRightHandSide: function(deltaTime){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              contactPointA = this.contactPointA,
              contactPointB = this.contactPointB,
              contactNormal = this.contactNormal,
              spatialA = this.jacobianElementA.spatial,
              spatialB = this.jacobianElementB.spatial,
              angularA = this.jacobianElementA.angular,
              angularB = this.jacobianElementB.angular,
              positionA = bodyA.position,
              positionB = bodyB.position

        vec3.negate(contactNormal, spatialA)
        vec3.copy(contactNormal, spatialB)
        vec3.cross(contactPointA, spatialA, angularA)
        vec3.cross(contactPointB, spatialB, angularB)

        const peneterationX = positionB[0] + contactPointB[0] - positionA[0] - contactPointA[0],
              peneterationY = positionB[1] + contactPointB[1] - positionA[1] - contactPointA[1],
              peneterationZ = positionB[2] + contactPointB[2] - positionA[2] - contactPointA[2],
              g = contactNormal[0] * peneterationX + contactNormal[1] * peneterationY + contactNormal[2] * peneterationZ,
              e1 = this.restitution + 1,
              GW = e1 * vec3.dot(bodyB.velocity, spatialB) 
                 + e1 * vec3.dot(bodyA.velocity, spatialA) 
                 + vec3.dot(bodyB.angularVelocity, angularB) 
                 + vec3.dot(bodyA.angularVelocity, angularA),
              GiMf = this.computeGiMf()
        return - g * this.a - GW * this.b - deltaTime * GiMf
    }
}, Equation.prototype)

export {ContactEquation}