import {Equation} from './equation'
import {vec3} from '../math/vec3'

const RotationalMotorEquation = _ => Object.setPrototypeOf(Object.assign(Equation(), {
    axisA: vec3(),
    axisB: vec3(),
    targetVelocity: 0
}), RotationalMotorEquation.prototype)

RotationalMotorEquation.prototype = Object.setPrototypeOf({
    computeRightHandSide: function(deltaTime){        
        vec3.copy(this.axisA, this.jacobianElementA.angular)
        vec3.negate(this.axisB, this.jacobianElementB.angular)
        
        const GW = this.computeBodyVelocities() - this.targetVelocity,
              GiMf = this.computeGiMf()
        return - GW * this.b - deltaTime * GiMf
    }
}, Equation.prototype)

export {RotationalMotorEquation}