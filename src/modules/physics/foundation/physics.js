import {tie, factory} from '../../util'
import {materialLibrary} from './materialLibrary'
import {DefaultBroadphase} from '../broadphase'
import {DefaultNarrowphase} from '../narrowphase'
import {DefaultSolver} from '../solver'

factory.declare('physics', (target, options) => {
    const broadphase = options.broadphase || DefaultBroadphase(),
          narrowphase = options.narrowphase || DefaultNarrowphase(),
          solver = options.solver || DefaultSolver(),
          equations = []
    let frame = 0

    target.addEventListener('bodyAdded', broadphase.add.bind(broadphase)) //TODO detaching
    target.addEventListener('bodyRemoved', broadphase.remove.bind(broadphase))
    
    const collisionEvent = {
        bodyA: null,
        bodyB: null,
        shapeA: null,
        shapeB: null,
        contactManifold: null
    }
    
    //TODO remove
    let pairs1 = [],
        pairs2 = []
    const collisionPairs = { //TODO have direct in out
        clear: _ => {
            pairs1.length = 0
            pairs2.length = 0
        },
        add: (a, b) => {
            pairs1.push(a)
            pairs2.push(b)
        }
    }
    
    return {
        get narrowphase(){ return narrowphase },
        get solver(){ return solver },
        get broadphase(){ return broadphase },
        contactRegistrator: (bodyA, bodyB, shapeA, shapeB, contactManifold) => {
            collisionEvent.bodyA = bodyA
            collisionEvent.bodyB = bodyB
            collisionEvent.shapeA = shapeA
            collisionEvent.shapeB = shapeB
            collisionEvent.contactManifold = contactManifold
            target.dispatchEvent('collision', collisionEvent)
            
            if(target.overlapMatrix.set(bodyA.index, bodyB.index, frame)){
                bodyA.dispatchEvent('collision', collisionEvent)
                bodyB.dispatchEvent('collision', collisionEvent)
            }
        },
        simulate: event => {
            frame = event.frame
            target.dispatchEvent('preStep', event)
            narrowphase.clear()
            broadphase.queryCandidates(collisionPairs)

            for(let i = pairs1.length - 1; i >= 0; i--){
                let bodyA = pairs1[i],
                    bodyB = pairs2[i],
                    material = materialLibrary.getContactMaterial(bodyA.material, bodyB.material)
                
                narrowphase.generateContactManifold(bodyA, bodyB, material, target.contactRegistrator, 
                                                 {deltaTime: event.deltaTime, gravity: target.gravity}) //TODO cache object
            }
            collisionPairs.clear()
            
            let contactEquations = narrowphase.contactEquations
            let frictionEquations = narrowphase.frictionEquations
            
            //TODO emit contact end events
            //TODO refactor events and order
            equations.length = 0
            equations.push.apply(equations, frictionEquations)
            equations.push.apply(equations, contactEquations)
            
            for(let i = target.constraints.length - 1; i >= 0; i--){
                let constraint = target.constraints[i]
                if(!constraint.enabled) continue
                constraint.update()
                equations.push.apply(equations, constraint.equations)
            }
            
            target.dispatchEvent('preSolve', event)
            solver.solve(equations, target.bodies, event.deltaTime)
            
            target.dispatchEvent('preIntegrate', event)
            target.integrate(event)
            target.dispatchEvent('postIntegrate', event)
            
            
            target.dispatchEvent('postStep', event)
        }
    }
})