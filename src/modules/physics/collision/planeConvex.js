import {vec3} from '../math/vec3'

const planeConvex = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context
    const vec3Pool = context.vec3Pool,
          vertices = shapeB.vertices,
          planeNormal = vec3.transformQuat(vec3.AXIS_Z, worldRotationA, vec3Pool.obtain()),
          planeConvex = vec3.subtract(worldPositionB, worldPositionA, vec3Pool.obtain()),
          worldVertex = vec3Pool.obtain()

    for(let i = vertices.length - 1; i >= 0; i--){
        vec3.transformQuat(vertices[i], worldRotationB, worldVertex)
        vec3.add(worldVertex, planeConvex, worldVertex)
        
        if(vec3.dot(planeNormal, worldVertex) > 0.0) continue
        if(bailEarly) return true
        
        vec3.copy(planeNormal, contactNormal)
        vec3.subtract(worldVertex, planeConvex, contactPointB)
        vec3.scale(planeNormal, vec3.dot(planeNormal, worldVertex), contactPointA)
        vec3.subtract(worldVertex, contactPointA, contactPointA)
        
        vec3.add(contactPointA, worldPositionA, contactPointA)
        vec3.add(contactPointB, worldPositionB, contactPointB)
        context.registerContact()
    }
    return !!context.contactPoints.length
}

export {planeConvex}