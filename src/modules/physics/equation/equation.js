import {vec3} from '../math/vec3'
import {mat3} from '../math/mat3'

const Jacobian = _ => ({ spatial: vec3(), angular: vec3() })
Jacobian.multiply = (a, b) => vec3.dot(a.spatial, b.spatial) + vec3.dot(a.angular, b.angular)

//SPOOK: A System for Probabilistic Object-Oriented Knowledge representation
const Equation = _ => Object.setPrototypeOf({
    id: Equation.prototype.globalCounter++,
    minForce: -1e6,
    maxForce: 1e6,
    bodyA: null,
    bodyB: null,
    a: 0.0,
    b: 0.0,
    eps: 0.0,
    jacobianElementA: Jacobian(),
    jacobianElementB: Jacobian()
}, Equation.prototype).setSpookParams(1e7, 4, 1/60)


Equation.prototype = {
    globalCounter: 0,
    setSpookParams: function(stiffness, relaxation, timeStep){
        this.a = 4.0 / (timeStep * (1 + 4 * relaxation))
        this.b = (4.0 * relaxation) / (1 + 4 * relaxation)
        this.eps = 4.0 / (timeStep * timeStep * stiffness * (1 + 4 * relaxation))
        return this
    },
    computeRightHandSide: function(deltaTime){
        const GW = this.computeBodyVelocities(),
              Gq = this.computeBodyCoordinates(),
              GiMf = this.computeGiMf()
        return - Gq * this.a - GW * this.b - GiMf * deltaTime
    },
    computeBodyCoordinates: function(){
        return vec3.dot(this.jacobianElementA.spatial, this.bodyA.position) + vec3.dot(this.jacobianElementB.spatial, this.bodyB.position)
    },
    computeBodyVelocities: function(){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              jacobianA = this.jacobianElementA,
              jacobianB = this.jacobianElementB
        return vec3.dot(jacobianA.spatial, bodyA.velocity) + vec3.dot(jacobianA.angular, bodyA.angularVelocity) + 
            vec3.dot(jacobianB.spatial, bodyB.velocity) + vec3.dot(jacobianB.angular, bodyB.angularVelocity)
    },
    computeGWlambda: function(){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              jacobianA = this.jacobianElementA,
              jacobianB = this.jacobianElementB
        return vec3.dot(jacobianA.spatial, bodyA.vlambda) + vec3.dot(jacobianA.angular, bodyA.wlambda) + 
            vec3.dot(jacobianB.spatial, bodyB.vlambda) + vec3.dot(jacobianB.angular, bodyB.wlambda)
    },
    computeDenominator: function(){
        return this.computeGiMGt() + this.eps
    },
    computeGiMf: function(){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              jacobianA = this.jacobianElementA,
              jacobianB = this.jacobianElementB,
              temp = vec3.temp
        let out = 0
        if(bodyA.dynamic){
            out += vec3.dot(jacobianA.spatial, vec3.scale(bodyA.force, bodyA.invMass, temp))
            out += vec3.dot(jacobianA.angular, vec3.transformMat3(bodyA.torque, bodyA.invInertiaWorld, temp))
        }
        if(bodyB.dynamic){
            out += vec3.dot(jacobianB.spatial, vec3.scale(bodyB.force, bodyB.invMass, temp))
            out += vec3.dot(jacobianB.angular, vec3.transformMat3(bodyB.torque, bodyB.invInertiaWorld, temp))
        }
        return out
    },
    computeGiMGt: function(){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              jacobianA = this.jacobianElementA,
              jacobianB = this.jacobianElementB,
              temp = vec3.temp
        let out = 0
        if(bodyA.dynamic){
            out += bodyA.invMass
            out += vec3.dot(jacobianA.angular, vec3.transformMat3(jacobianA.angular, bodyA.invInertiaWorld, temp))
        }
        if(bodyB.dynamic){
            out += bodyB.invMass
            out += vec3.dot(jacobianB.angular, vec3.transformMat3(jacobianB.angular, bodyB.invInertiaWorld, temp))
        }
        return out
    },
    addToWlambda: function(deltalambda){
        const bodyA = this.bodyA,
              bodyB = this.bodyB,
              jacobianA = this.jacobianElementA,
              jacobianB = this.jacobianElementB,
              temp = vec3.temp
        if(bodyA.dynamic){
            vec3.scale(jacobianA.spatial, bodyA.invMass * deltalambda, temp)
            vec3.add(bodyA.vlambda, temp, bodyA.vlambda)
        
            vec3.transformMat3(jacobianA.angular, bodyA.invInertiaWorld, temp)
            vec3.scale(temp, deltalambda, temp)
            vec3.add(bodyA.wlambda, temp, bodyA.wlambda)
        }
        if(bodyB.dynamic){
            vec3.scale(jacobianB.spatial, bodyB.invMass * deltalambda, temp)
            vec3.add(bodyB.vlambda, temp, bodyB.vlambda)
        
            vec3.transformMat3(jacobianB.angular, bodyB.invInertiaWorld, temp)
            vec3.scale(temp, deltalambda, temp)
            vec3.add(bodyB.wlambda, temp, bodyB.wlambda)
        }
    }
}

export {Equation}