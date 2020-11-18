import {vec2} from '../../math'
import {vec3} from '../math/vec3'
import {Transform} from '../math/transform'
import {clipAgainstHull, findSeparatingAxis, SATContext} from '../math/separatingAxis'

const satContext = SATContext()

const convexConvex = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context
    const vec3Pool = context.vec3Pool,
          separatingAxis = vec3Pool.obtain(),
          convexToConvex = vec3Pool.obtain(),
          minDistance = shapeA.boundingSphereRadius + shapeB.boundingSphereRadius
    if(vec3.differenceSquared(worldPositionA, worldPositionB) > minDistance * minDistance) return false

    satContext.vec3Pool = vec3Pool
    
    if(!findSeparatingAxis(satContext, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, separatingAxis)) return false
    let result = []
    //TODO set -minDistance, minDistance
    clipAgainstHull(satContext, shapeA, worldPositionA, worldRotationA, shapeB, worldPositionB, worldRotationB, separatingAxis, -100, 100, result) 
    
    if(bailEarly && result.length) return true

    for(let i = result.length - 1; i >= 0 ; i--){
        vec3.negate(separatingAxis, contactNormal)
        vec3.negate(result[i].normal, convexToConvex)
        vec3.scale(convexToConvex, result[i].depth, convexToConvex)
        vec3.add(result[i].point, convexToConvex, contactPointA)
        vec3.copy(result[i].point, contactPointB)
        
        context.registerContact()
    }
    return !!context.contactPoints.length
}

export {convexConvex}