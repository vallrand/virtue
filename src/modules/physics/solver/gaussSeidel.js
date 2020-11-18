import {vec3} from '../math/vec3'

const GaussSeidelSolver = options => {
    options = Object.assign({
        iterations: 10,
        tolerance: 1e-7
    }, options || {})
    
    const invDenominators = [],
          rightHandSideValues = [],
          lambdas = []
    
    return {
        get tolerance(){ return options.tolerance },
        get iterations(){ return options.iterations },
        set tolerance(value){ options.tolerance = value },
        set iterations(value){ options.iterations = value },
        solve: (equations, bodies, deltaTime) => {
            const toleranceSquared = options.tolerance * options.tolerance,
                  maxIterations = options.iterations,
                  equationCount = invDenominators.length = rightHandSideValues.length = lambdas.length = equations.length
            let iteration = 0
            
            if(equationCount == 0) return 0
            
            for(let i = bodies.length - 1; i >= 0; i--){
                vec3.copy(vec3.ZERO, bodies[i].vlambda)
                vec3.copy(vec3.ZERO, bodies[i].wlambda)
            }
                
            for(let i = 0; i < equationCount; i++){
                let equation = equations[i]
                lambdas[i] = 0.0
                rightHandSideValues[i] = equation.computeRightHandSide(deltaTime)
                invDenominators[i] = 1.0 / equation.computeDenominator()
            }
            
            for(iteration = 0; iteration < maxIterations; iteration++){
                let totalError = 0.0
                for(let i = 0; i < equationCount; i++){
                    let equation = equations[i],
                        rhs = rightHandSideValues[i],
                        invDenominator = invDenominators[i],
                        lambda = lambdas[i],
                        GWlambda = equation.computeGWlambda(),
                        deltalambda = invDenominator * (rhs - GWlambda - equation.eps * lambda)
                    
                    deltalambda = Math.clamp(deltalambda, equation.minForce - lambda, equation.maxForce - lambda)
                    lambdas[i] += deltalambda
                    totalError += Math.abs(deltalambda)
                    equation.addToWlambda(deltalambda)
                }
                if(totalError * totalError < toleranceSquared) break
            }
            
            for(let i = bodies.length - 1; i >= 0; i--){
                let body = bodies[i]
                vec3.multiply(body.vlambda, body.linearFactor, body.vlambda)
                vec3.add(body.velocity, body.vlambda, body.velocity)
                
                vec3.multiply(body.wlambda, body.angularFactor, body.wlambda)
                vec3.add(body.angularVelocity, body.wlambda, body.angularVelocity)
            }
            return iteration
        }
    }
}

export {GaussSeidelSolver}