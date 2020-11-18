import {vec3} from '../math/vec3'
import {quat} from '../math/quat'
import {Pool} from '../../util'
import {ContactManifold, ManifoldContext} from './manifold'
import {ContactEquation} from '../equation/contactEquation'
import {FrictionEquation} from '../equation/frictionEquation'

//TODO move into separate file?
const frictionEquationGenerator = (frictionEquationPool, frictionEquations) => 
(bodyA, bodyB, shapeA, shapeB, material, contactPoint, deltaTime, gravity) => {
    let friction = material.friction
    if(friction <= 0) return false
    
    let g = friction * vec3.distance(gravity) //TODO precalc?
    let reducedMass = bodyA.invMass + bodyB.invMass
    if(reducedMass > 0) reducedMass = 1.0 / reducedMass
    let slipForce = g * reducedMass
    
    let equationA = frictionEquationPool.obtain()
    let equationB = frictionEquationPool.obtain()
    equationA.bodyA = equationB.bodyA = bodyA
    equationA.bodyB = equationB.bodyB = bodyB
    equationA.minForce = equationB.minForce = -slipForce
    equationA.maxForce = equationB.maxForce = slipForce
    
    vec3.copy(contactPoint.contactPointA, equationA.contactPointA)
    vec3.copy(contactPoint.contactPointA, equationB.contactPointA)
    vec3.copy(contactPoint.contactPointB, equationA.contactPointB)
    vec3.copy(contactPoint.contactPointB, equationB.contactPointB)
    
    vec3.extractTangents(contactPoint.contactNormal, equationA.contactTangent, equationB.contactTangent)
    
    equationA.setSpookParams(material.frictionEquationStiffness, material.frictionEquationRelaxation, deltaTime)
    equationB.setSpookParams(material.frictionEquationStiffness, material.frictionEquationRelaxation, deltaTime)

    frictionEquations.push(equationA, equationB)
    return true
}

const contactEquationGenerator = (contactEquationPool, contactEquations) => 
(bodyA, bodyB, shapeA, shapeB, material, contactPoint, deltaTime) => {
    const equation = contactEquationPool.obtain()
    equation.bodyA = bodyA
    equation.bodyB = bodyB
    equation.restitution = material.restitution
    equation.setSpookParams(material.contactEquationStiffness, material.contactEquationRelaxation, deltaTime)
    
    vec3.copy(contactPoint.contactNormal, equation.contactNormal)
    vec3.copy(contactPoint.contactPointA, equation.contactPointA)
    vec3.copy(contactPoint.contactPointB, equation.contactPointB)
    
    contactEquations.push(equation)
    return equation
}

const Narrowphase = (collisionDetector, options) => {
    options = Object.assign({
        frictionReduction: false
    }, options || {})
    const manifoldContext = ManifoldContext(),
          worldPositionA = manifoldContext.worldPositionA,
          worldPositionB = manifoldContext.worldPositionB,
          worldRotationA = manifoldContext.worldRotationA,
          worldRotationB = manifoldContext.worldRotationB,
          contactEquationPool = Pool(_ => ContactEquation()),
          frictionEquationPool = Pool(_ => FrictionEquation()),
          contactEquations = [],
          frictionEquations = [],
          generateContactEquation = contactEquationGenerator(contactEquationPool, contactEquations),
          generateFrictionEquation = frictionEquationGenerator(frictionEquationPool, frictionEquations)
    
    return {
        generateContactManifold: (bodyA, bodyB, material, contactRegistrator, {deltaTime, gravity}) => {
            manifoldContext.bodyA = bodyA
            manifoldContext.bodyB = bodyB
            manifoldContext.material = material
            
            for(let shapesA = bodyA.shapes, a = shapesA.length - 1; a >= 0; a--){
                quat.multiply(bodyA.quaternion, bodyA.shapeOrientations[a], worldRotationA)
                vec3.transformQuat(bodyA.shapeOffsets[a], bodyA.quaternion, worldPositionA)
                vec3.add(bodyA.position, worldPositionA, worldPositionA)
                let shapeA = manifoldContext.shapeA = shapesA[a]
                
            for(let shapesB = bodyB.shapes, b = shapesB.length - 1; b >= 0; b--){
                quat.multiply(bodyB.quaternion, bodyB.shapeOrientations[b], worldRotationB)
                vec3.transformQuat(bodyB.shapeOffsets[b], bodyB.quaternion, worldPositionB)
                vec3.add(bodyB.position, worldPositionB, worldPositionB)
                let shapeB = manifoldContext.shapeB = shapesB[b]
                
                if(vec3.differenceSquared(worldPositionA, worldPositionB) > Math.pow(shapeA.boundingSphereRadius + shapeB.boundingSphereRadius, 2))
                    continue
                    
                if(material.collisionResponse){
                    collisionDetector.test(manifoldContext, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, false)
                    //TODO move handling outside?
                    for(let i = manifoldContext.contactPoints.length - 1; i >= 0 ; i--){
                        const equation = generateContactEquation(bodyA, bodyB, shapeA, shapeB, material, manifoldContext.contactPoints[i], deltaTime)
                        if(!options.frictionReduction)
                            generateFrictionEquation(bodyA, bodyB, shapeA, shapeB, material, manifoldContext.contactPoints[i], deltaTime, gravity)
                        }
                    //TODO is that the place? have it separately?
                    if(options.frictionReduction && manifoldContext.contactPoints.length){
                        let averageContactPoint = manifoldContext.contactPoints[0]
                        let invCount = 1.0 / manifoldContext.contactPoints.length
                        for(let i = manifoldContext.contactPoints.length - 1; i > 0 ; i--){
                            vec3.add(averageContactPoint.contactNormal,  manifoldContext.contactPoints[i].contactNormal)
                            vec3.add(averageContactPoint.contactPointA,  manifoldContext.contactPoints[i].contactPointA)
                            vec3.add(averageContactPoint.contactPointB,  manifoldContext.contactPoints[i].contactPointB)
                        }
                        vec3.normalize(averageContactPoint.contactNormal, averageContactPoint.contactNormal)
                        vec3.scale(averageContactPoint.contactPointA, invCount, averageContactPoint.contactPointA)
                        vec3.scale(averageContactPoint.contactPointB, invCount, averageContactPoint.contactPointB)
                        generateFrictionEquation(bodyA, bodyB, shapeA, shapeB, material, averageContactPoint, deltaTime, gravity)
                    }
                    if(manifoldContext.contactPoints.length)
                        contactRegistrator(bodyA, bodyB, shapeA, shapeB, manifoldContext)
                        
                }else if(collisionDetector.test(manifoldContext, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, true))
                    contactRegistrator(bodyA, bodyB, shapeA, shapeB)
                manifoldContext.clear()
            }
            }
        },
        get contactEquations(){ return contactEquations },
        get frictionEquations(){ return frictionEquations },
        clear: _ => {
            contactEquationPool.release.apply(contactEquationPool, contactEquations)
            frictionEquationPool.release.apply(frictionEquationPool, frictionEquations)
            contactEquations.length = 0
            frictionEquations.length = 0
        }
    }
}

export {Narrowphase}