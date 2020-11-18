import {vec3} from '../math/vec3'
import {mat3} from '../math/mat3'
import {clipFaceAgainstPlane} from '../math/separatingAxis'

const rotationMatrixA = mat3(),
      rotationMatrixB = mat3(),
      axesA = [new Float32Array(rotationMatrixA.buffer, 0, 3),
               new Float32Array(rotationMatrixA.buffer, Float32Array.BYTES_PER_ELEMENT * 3, 3),
               new Float32Array(rotationMatrixA.buffer, Float32Array.BYTES_PER_ELEMENT * 6, 3)],
      axesB = [new Float32Array(rotationMatrixB.buffer, 0, 3),
               new Float32Array(rotationMatrixB.buffer, Float32Array.BYTES_PER_ELEMENT * 3, 3),
               new Float32Array(rotationMatrixB.buffer, Float32Array.BYTES_PER_ELEMENT * 6, 3)],
      crossAxes = Array(9).fill().map(_ => vec3())

const boxBox = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context
    const vec3Pool = context.vec3Pool,
          difference = vec3.subtract(worldPositionB, worldPositionA, vec3Pool.obtain())
    
    mat3.fromQuat(worldRotationA, rotationMatrixA)
    mat3.fromQuat(worldRotationB, rotationMatrixB)
    const axisXA = axesA[0], axisYA = axesA[1], axisZA = axesA[2],
          axisXB = axesB[0], axisYB = axesB[1], axisZB = axesB[2],
          dotXX = vec3.dot(axisXA, axisXB), dotXY = vec3.dot(axisXA, axisYB), dotXZ = vec3.dot(axisXA, axisZB),
          dotYX = vec3.dot(axisYA, axisXB), dotYY = vec3.dot(axisYA, axisYB), dotYZ = vec3.dot(axisYA, axisZB),
          dotZX = vec3.dot(axisZA, axisXB), dotZY = vec3.dot(axisZA, axisYB), dotZZ = vec3.dot(axisZA, axisZB),
          sideB = shapeB.halfExtents,
          sideA = shapeA.halfExtents
    
    let dimensionA = vec3Pool.obtain(),
        dimensionB = vec3Pool.obtain(),
        axisIndex = -1,
        minDepth = -Number.MAX_VALUE,
        sign, distance, overlap,
        overlapOffset = 0.01,
        lengthThreshold = 1e-5
        
    distance = vec3.dot(axisXA, difference)
    vec3.set(Math.abs(dotXX), Math.abs(dotXY), Math.abs(dotXZ), dimensionB)
    overlap = Math.abs(distance) - sideA[0] - vec3.dot(dimensionB, sideB)
    if(overlap > 0) return false
    else if(overlap > minDepth){
        minDepth = overlap
        axisIndex = 0x1
        sign = distance > 0
    }
    distance = vec3.dot(axisYA, difference)
    vec3.set(Math.abs(dotYX), Math.abs(dotYY), Math.abs(dotYZ), dimensionB)
    overlap = Math.abs(distance) - sideA[1] - vec3.dot(dimensionB, sideB)
    if(overlap > 0) return false
    else if(overlap > minDepth){
        minDepth = overlap
        axisIndex = 0x2
        sign = distance > 0
    }
    distance = vec3.dot(axisZA, difference)
    vec3.set(Math.abs(dotZX), Math.abs(dotZY), Math.abs(dotZZ), dimensionB)
    overlap = Math.abs(distance) - sideA[2] - vec3.dot(dimensionB, sideB)
    if(overlap > 0) return false
    else if(overlap > minDepth){
        minDepth = overlap
        axisIndex = 0x3
        sign = distance > 0
    }
    distance = vec3.dot(axisXB, difference)
    vec3.set(Math.abs(dotXX), Math.abs(dotYX), Math.abs(dotZX), dimensionA)
    overlap = Math.abs(distance) - sideB[0] - vec3.dot(dimensionA, sideA)
    if(overlap > 0) return false
    else if(overlap > minDepth){
        minDepth = overlap
        axisIndex = 0x4
        sign = distance > 0
    }
    distance = vec3.dot(axisYB, difference)
    vec3.set(Math.abs(dotXY), Math.abs(dotYY), Math.abs(dotZY), dimensionA)
    overlap = Math.abs(distance) - sideB[1] - vec3.dot(dimensionA, sideA)
    if(overlap > 0) return false
    else if(overlap > minDepth){
        minDepth = overlap
        axisIndex = 0x5
        sign = distance > 0
    }
    distance = vec3.dot(axisZB, difference)
    vec3.set(Math.abs(dotXZ), Math.abs(dotYZ), Math.abs(dotZZ), dimensionA)
    overlap = Math.abs(distance) - sideB[2] - vec3.dot(dimensionA, sideA)
    if(overlap > 0) return false
    else if(overlap > minDepth){
        minDepth = overlap
        axisIndex = 0x6
        sign = distance > 0
    }
    
    for(let a = 0; a < 3; a++) for(let b = 0; b < 3; b++){ //TODO:  if cross is 0 -> X and Y axes are the same.
        const crossAxis = vec3.cross(axesA[a], axesB[b], crossAxes[a * 3 + b])
        if((distance = vec3.distanceSquared(crossAxis)) <= lengthThreshold) continue
        distance = vec3.dot(vec3.scale(crossAxis, 1 / Math.sqrt(distance), crossAxis), difference)
        vec3.set(a == 0 ? 0 : Math.abs(vec3.dot(crossAxis, axisXA)),
                 a & 1  ? 0 : Math.abs(vec3.dot(crossAxis, axisYA)),
                 a & 2  ? 0 : Math.abs(vec3.dot(crossAxis, axisZA)), dimensionA)
        vec3.set(b == 0 ? 0 : Math.abs(vec3.dot(crossAxis, axisXB)),
                 b & 1  ? 0 : Math.abs(vec3.dot(crossAxis, axisYB)),
                 b & 2  ? 0 : Math.abs(vec3.dot(crossAxis, axisZB)), dimensionB)
        overlap = Math.abs(distance) - vec3.dot(dimensionA, sideA) - vec3.dot(dimensionB, sideB)
        if(overlap > 0) return false
        else if(overlap - overlapOffset > minDepth){
            minDepth = overlap
            axisIndex = 0x7 + a * 3 + b
            sign = distance > 0
        }
    }
    
    const halfX = vec3.scale(axisXA, sideA[0], vec3Pool.obtain()),
          halfY = vec3.scale(axisYA, sideA[1], vec3Pool.obtain()),
          halfZ = vec3.scale(axisZA, sideA[2], vec3Pool.obtain()),
          verticesA = Array(8)
    for(let i = 0; i < 8; i++){
        let vertex = verticesA[i] = vec3.copy(worldPositionA, vec3Pool.obtain())
        i & 0x4 ? vec3.subtract(vertex, halfX, vertex) : vec3.add(vertex, halfX, vertex)
        i & 0x2 ? vec3.subtract(vertex, halfY, vertex) : vec3.add(vertex, halfY, vertex)
        i & 0x1 ? vec3.subtract(vertex, halfZ, vertex) : vec3.add(vertex, halfZ, vertex)
    }
    vec3.scale(axisXB, sideB[0], halfX)
    vec3.scale(axisYB, sideB[1], halfY)
    vec3.scale(axisZB, sideB[2], halfZ)
    const verticesB = Array(8)
    for(let i = 0; i < 8; i++){
        let vertex = verticesB[i] = vec3.copy(worldPositionB, vec3Pool.obtain())
        i & 0x4 ? vec3.subtract(vertex, halfX, vertex) : vec3.add(vertex, halfX, vertex)
        i & 0x2 ? vec3.subtract(vertex, halfY, vertex) : vec3.add(vertex, halfY, vertex)
        i & 0x1 ? vec3.subtract(vertex, halfZ, vertex) : vec3.add(vertex, halfZ, vertex)
    }
    let normal = vec3Pool.obtain(),
        tangent = vec3Pool.obtain(),
        binormal = vec3Pool.obtain() //TODO just assign instead of copy
    
    if(axisIndex > 0x6){
        if(bailEarly) return true
        axisIndex -= 0x7
        normal = crossAxes[axisIndex]
        tangent = axesA[(axisIndex / 3) | 0]
        binormal = axesB[axisIndex % 3]

        if(!sign) vec3.negate(normal, normal)
        
        let distance, vertexA, vertexB,
            maxDistance = -Number.MAX_VALUE,
            minDistance = Number.MAX_VALUE
        
        for(let i = 0; i < 8; i++)
            if((distance = vec3.dot(normal, verticesA[i])) > maxDistance){
                maxDistance = distance
                vertexA = verticesA[i]
            }
        for(let i = 0; i < 8; i++)
            if((distance = vec3.dot(normal, verticesB[i])) < minDistance){
                minDistance = distance
                vertexB = verticesB[i]
            }
        let vertex = vec3.subtract(vertexB, vertexA, vec3Pool.obtain())
        let dot = vec3.dot(tangent, binormal)
        vec3.subtract(tangent, vec3.scale(binormal, dot, binormal), binormal)
        vec3.add(vertexA, vec3.scale(tangent, vec3.dot(vertex, binormal) / (1 - dot*dot), tangent), vertex)
        vec3.add(vertex, vec3.scale(normal, minDepth * 0.5, vec3.temp), vertex)
        
        vec3.dot(normal, difference) < 0 ? vec3.negate(normal, contactNormal) : vec3.copy(normal, contactNormal) //TODO use sign
        vec3.copy(vertex, contactPointB)
        vec3.scale(contactNormal, -minDepth, contactPointA)
        vec3.add(contactPointB, contactPointA, contactPointA)
        context.registerContact()
        return true
    }
    
    const sideLength = vec3Pool.obtain(),
          oppositeAxes = vec3Pool.obtain()
    switch(axisIndex){
        case 0x1: vec3.copy(axisXA, normal), vec3.copy(axisYA, tangent), vec3.copy(axisZA, binormal),
            vec3.set(dotXX, dotXY, dotXZ, oppositeAxes), vec3.set(sideA[0], sideA[1], sideA[2], sideLength); break
        case 0x2: vec3.copy(axisYA, normal), vec3.copy(axisXA, tangent), vec3.copy(axisZA, binormal),
            vec3.set(dotYX, dotYY, dotYZ, oppositeAxes), vec3.set(sideA[1], sideA[0], sideA[2], sideLength); break
        case 0x3: vec3.copy(axisZA, normal), vec3.copy(axisXA, tangent), vec3.copy(axisYA, binormal),
            vec3.set(dotZX, dotZY, dotZZ, oppositeAxes), vec3.set(sideA[2], sideA[0], sideA[1], sideLength); break
        case 0x4: vec3.negate(axisXB, normal), vec3.copy(axisYB, tangent), vec3.copy(axisZB, binormal),
            vec3.set(-dotXX, -dotYX, -dotZX, oppositeAxes), vec3.set(sideB[0], sideB[1], sideB[2], sideLength); break
        case 0x5: vec3.negate(axisYB, normal), vec3.copy(axisXB, tangent), vec3.copy(axisZB, binormal),
            vec3.set(-dotXY, -dotYY, -dotZY, oppositeAxes), vec3.set(sideB[1], sideB[0], sideB[2], sideLength); break
        case 0x6: vec3.negate(axisZB, normal), vec3.copy(axisXB, tangent), vec3.copy(axisYB, binormal),
            vec3.set(-dotXZ, -dotYZ, -dotZZ, oppositeAxes), vec3.set(sideB[2], sideB[0], sideB[1], sideLength); break
    }
    if(!sign) vec3.negate(normal, normal)
    if(!sign) vec3.negate(oppositeAxes, oppositeAxes)
    const center = vec3.scale(normal, sideLength[0], vec3Pool.obtain()),
          edgeA = vec3.scale(tangent, sideLength[1], vec3Pool.obtain()),
          edgeB = vec3.scale(binormal, sideLength[2], vec3Pool.obtain())
    vec3.add(axisIndex > 0x3 ? worldPositionB : worldPositionA, center, center)
    
    const planeC1 = -vec3.dot(vec3.add(center, edgeA, vec3.temp), tangent),
          planeC2 = -vec3.dot(vec3.add(center, edgeB, vec3.temp), binormal),
          planeC3 = vec3.dot(vec3.subtract(center, edgeA, vec3.temp), tangent),
          planeC4 = vec3.dot(vec3.subtract(center, edgeB, vec3.temp), binormal)
    
    let clipVertices = [[], []] //TODO use verticesA and -B arrays instead
    
    let faceIndex = -1,
        faceVertices = axisIndex > 0x3 ? verticesA : verticesB
    for(let index = 0, minDot = Number.MAX_VALUE; index < 6; index++){
        let dot = oppositeAxes[(index/2)|0] * (-(index & 0x1) || 1)
        if(dot >= minDot) continue
        minDot = dot
        faceIndex = index
    }
    switch(faceIndex){
        case 0: clipVertices[0].push(faceVertices[0], faceVertices[2], faceVertices[3], faceVertices[1]); break
        case 1: clipVertices[0].push(faceVertices[5], faceVertices[7], faceVertices[6], faceVertices[4]); break
        case 2: clipVertices[0].push(faceVertices[4], faceVertices[0], faceVertices[1], faceVertices[5]); break
        case 3: clipVertices[0].push(faceVertices[7], faceVertices[3], faceVertices[2], faceVertices[6]); break
        case 4: clipVertices[0].push(faceVertices[4], faceVertices[6], faceVertices[2], faceVertices[0]); break
        case 5: clipVertices[0].push(faceVertices[1], faceVertices[3], faceVertices[7], faceVertices[5]); break
    }
    
    if(!clipFaceAgainstPlane(vec3Pool, clipVertices[0], tangent, planeC1, clipVertices[1]).length) return false
    clipVertices[0].length = 0
    if(!clipFaceAgainstPlane(vec3Pool, clipVertices[1], binormal, planeC2, clipVertices[0]).length) return false
    clipVertices[1].length = 0
    if(!clipFaceAgainstPlane(vec3Pool, clipVertices[0], vec3.negate(tangent, tangent), planeC3, clipVertices[1]).length) return false
    clipVertices[0].length = 0
    if(!clipFaceAgainstPlane(vec3Pool, clipVertices[1], vec3.negate(binormal, binormal), planeC4, clipVertices[0]).length) return false

    let dot, centerDot = -vec3.dot(center, normal)

    for(let i = 0; i < clipVertices[0].length; i++)
        if((dot = vec3.dot(normal, clipVertices[0][i]) + centerDot) < 0){
            vec3.dot(normal, difference) < 0 ? vec3.negate(normal, contactNormal) : vec3.copy(normal, contactNormal) //TODO use sign (swap -> -sign)
            vec3.copy(clipVertices[0][i], contactPointB)
            vec3.scale(contactNormal, -dot, contactPointA)
            vec3.add(contactPointB, contactPointA, contactPointA)
            context.registerContact()
        }
    return !!context.contactPoints.length
}

export {boxBox}