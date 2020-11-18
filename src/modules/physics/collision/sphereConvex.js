import {vec3} from '../math/vec3'

const sphereConvex = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context
    const vec3Pool = context.vec3Pool,
          normals = shapeB.faceNormals,
          faces = shapeB.faces,
          vertices = shapeB.vertices,
          radius = shapeA.radius,
          tempVertices = [],
          convexToSphere = vec3.subtract(worldPositionA, worldPositionB, vec3Pool.obtain())
    
    let face = null,
        faceNormal = vec3Pool.obtain(),
        facePeneteration = Number.MAX_VALUE
    
    const tempFaceNormal = vec3Pool.obtain()
    for(let i = faces.length - 1; i >= 0; i--){
        let faceVertices = faces[i],
            index = faceVertices[0],
            vertex = tempVertices[index] || vec3.subtract(tempVertices[index] = 
        vec3.transformQuat(vertices[index], worldRotationB, vec3Pool.obtain()), convexToSphere, tempVertices[index])
        vec3.transformQuat(normals[i], worldRotationB, tempFaceNormal)
        let peneteration = vec3.dot(tempFaceNormal, vertex) + radius
        
        if(peneteration < 0) return false
        
        if(facePeneteration <= peneteration) continue
        
        facePeneteration = peneteration
        face = faceVertices
        vec3.copy(tempFaceNormal, faceNormal)
    }
    
    let edgePoint = null,
        edgeDirection = vec3Pool.obtain(),
        edgeNormal = vec3Pool.obtain(),
        edgePeneteration = Number.MAX_VALUE

    const tempEdgeDirection = vec3Pool.obtain(),
          tempEdgeNormal = vec3Pool.obtain()
    for(let i = face.length - 1; i >= 0; i--){
        let indexA = face[i],
            indexB = face[(i + 1) % face.length],
            vertexB = tempVertices[indexB],
            vertexA = tempVertices[indexA] || vec3.subtract(tempVertices[indexA] = 
        vec3.transformQuat(vertices[indexA], worldRotationB, vec3Pool.obtain()), convexToSphere, tempVertices[indexA])
        
        vec3.subtract(vertexB, vertexA, tempEdgeDirection)
        vec3.cross(faceNormal, tempEdgeDirection, tempEdgeNormal)
        vec3.normalize(tempEdgeNormal, tempEdgeNormal)
        
        let distance = - vec3.dot(vertexA, tempEdgeNormal) + radius

        if(distance < 0) return false

        if(edgePeneteration <= distance) continue
        
        edgePeneteration = distance
        edgePoint = vertexA
        vec3.copy(tempEdgeNormal, edgeNormal)
        vec3.copy(tempEdgeDirection, edgeDirection)
    }
    
    if(edgePeneteration <= radius){
        vec3.normalize(edgeDirection, contactNormal)
        
        let projection = Math.clamp(-vec3.dot(edgePoint, contactNormal), 0, vec3.distance(edgeDirection))
        vec3.scale(contactNormal, projection, contactNormal)
        vec3.add(edgePoint, contactNormal, contactNormal)
        
        if(vec3.distanceSquared(contactNormal) > radius * radius) return false
        if(bailEarly) return true
        
        vec3.add(convexToSphere, contactNormal, contactPointB)
        
        vec3.normalize(contactNormal, contactNormal)
        vec3.scale(contactNormal, radius, contactPointA)
    }else{
        if(bailEarly) return true
        
        vec3.negate(faceNormal, contactNormal)
        
        vec3.scale(contactNormal, radius - facePeneteration, contactPointB)
        vec3.add(convexToSphere, contactPointB, contactPointB)
        
        vec3.scale(contactNormal, radius, contactPointA)
    }
    
    vec3.add(contactPointB, worldPositionB, contactPointB)
    vec3.add(contactPointA, worldPositionA, contactPointA)
    context.registerContact()
    return true
}

export {sphereConvex}