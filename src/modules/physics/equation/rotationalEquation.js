import {Equation} from './equation'
import {vec3} from '../math/vec3'

const RotationalEquation = _ => Object.setPrototypeOf(Object.assign(Equation(), {
    axisA: vec3.copy(vec3.AXIS_X),
    axisB: vec3.copy(vec3.AXIS_Y),
    maxAngle: Math.PI / 2
}), RotationalEquation.prototype)

RotationalEquation.prototype = Object.setPrototypeOf({
    computeRightHandSide: function(deltaTime){
        const normalA = this.axisA,
              normalB = this.axisB,
              angularA = this.jacobianElementA.angular,
              angularB = this.jacobianElementB.angular
        vec3.cross(normalA, normalB, angularB)
        vec3.cross(normalB, normalA, angularA)
        const g = Math.cos(this.maxAngle) - vec3.dot(normalA, normalB),
              GW = this.computeBodyVelocities(),
              GiMf = this.computeGiMf()
        return - g * this.a - GW * this.b - deltaTime * GiMf
    }
}, Equation.prototype)

export {RotationalEquation}