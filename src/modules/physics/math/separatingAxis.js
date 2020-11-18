import {vec2} from '../../math'
import {Pool} from '../../util'
import {vec3} from '../math/vec3'

const SATContext = _ => {
    const worldNormalsA = [],
          worldNormalsB = [],
          worldVerticesA = [],
          worldVerticesB = [],
          clippedVertices = [],
          connectedFaces = [],
          contactPoints = [],
          minmax = vec2()
    return {
        vec3Pool: null,
        worldNormalsA, worldNormalsB, worldVerticesA, worldVerticesB, clippedVertices, connectedFaces, contactPoints, minmax,
        clear: _ => {
            worldNormalsA.length = 0
            worldNormalsB.length = 0
            worldVerticesA.length = 0
            worldVerticesB.length = 0
            clippedVertices.length = 0
            connectedFaces.length = 0
            contactPoints.length = 0
        },
        precompute: function(hullA, positionA, rotationA, hullB, positionB, rotationB){
            const vec3Pool = this.vec3Pool
            for(let i = hullA.vertices.length - 1; i >= 0; i--){
                let vertex = vec3.transformQuat(hullA.vertices[i], rotationA, vec3Pool.obtain())
                worldVerticesA[i] = vec3.add(positionA, vertex, vertex)
            }
            for(let i = hullB.vertices.length - 1; i >= 0; i--){
                let vertex = vec3.transformQuat(hullB.vertices[i], rotationB, vec3Pool.obtain())
                worldVerticesB[i] = vec3.add(positionB, vertex, vertex)
            }
            for(let i = hullA.faceNormals.length - 1; i >= 0; i--)
                worldNormalsA[i] = vec3.transformQuat(hullA.faceNormals[i], rotationA, vec3Pool.obtain())
            for(let i = hullB.faceNormals.length - 1; i >= 0; i--)
                worldNormalsB[i] = vec3.transformQuat(hullB.faceNormals[i], rotationB, vec3Pool.obtain())
        }
    }
}

const projectConvexAxis = (vertices, origin, axis, out = vec2()) => {
    const offset = origin ? vec3.dot(origin, axis) : 0
    let value,
        min = Number.MAX_VALUE,
        max = -Number.MAX_VALUE
    for(let i = vertices.length - 1; i >= 0; i--){
        value = vec3.dot(vertices[i], axis)
        if(value > max) max = value
        if(value < min) min = value
    }
    out[0] = min - offset
    out[1] = max - offset
    return out
}

const testSeparatingAxis = (context, axis) => {
    const dotMaxMin = context.minmax
    projectConvexAxis(context.worldVerticesA, 0, axis, dotMaxMin)
    const minA = dotMaxMin[0],
          maxA = dotMaxMin[1]
    projectConvexAxis(context.worldVerticesB, 0, axis, dotMaxMin)
    const minB = dotMaxMin[0],
          maxB = dotMaxMin[1]
    const d0 = maxA - minB,
          d1 = maxB - minA
    if(d0 < 0 || d1 < 0) return false
    return d0 < d1 ? d0 : d1
}


const findSeparatingAxis = (context, hullA, hullB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, separatingNormal) => {
    context.clear()
    context.precompute(hullA, worldPositionA, worldRotationA, hullB, worldPositionB, worldRotationB)
    
    const vec3Pool = context.vec3Pool,
          faceNormal = vec3Pool.obtain()
    let minDistance = Number.MAX_VALUE

    const axesA = hullA.uniqueAxes || hullA.faceNormals
    const axesB = hullB.uniqueAxes || hullB.faceNormals
    
    for(let i = axesA.length - 1; i >= 0; i--){
        vec3.transformQuat(axesA[i], worldRotationA, faceNormal)
        let distance = testSeparatingAxis(context, faceNormal)
        if(distance === false) return false
        if(distance >= minDistance) continue
        minDistance = distance
        vec3.copy(faceNormal, separatingNormal)
    }
    
    for(let i = axesB.length - 1; i >= 0; i--){
        vec3.transformQuat(axesB[i], worldRotationB, faceNormal)
        let distance = testSeparatingAxis(context, faceNormal)
        if(distance === false) return false
        if(distance >= minDistance) continue
        minDistance = distance
        vec3.copy(faceNormal, separatingNormal)
    }
    
    const edges = [],
          cross = vec3Pool.obtain(),
          edge0 = vec3Pool.obtain()
    
    for(let e0 = hullA.uniqueEdges.length - 1; e0 >= 0; e0--){
        vec3.transformQuat(hullA.uniqueEdges[e0], worldRotationA, edge0)

        for(let e1 = hullB.uniqueEdges.length - 1; e1 >= 0; e1--){
            let edge1 = edges[e1] || (edges[e1] = vec3.transformQuat(hullB.uniqueEdges[e1], worldRotationB, vec3Pool.obtain()))
            vec3.cross(edge0, edge1, cross)

            if(vec3.equals(cross, vec3.ZERO)) continue
            vec3.normalize(cross, cross)
            let distance = testSeparatingAxis(context, cross)
            if(distance === false) return false
            if(distance >= minDistance) continue
            minDistance = distance
            vec3.copy(cross, separatingNormal)
        }
    }
    const delta = vec3.subtract(worldPositionB, worldPositionA, vec3Pool.obtain())
    if(vec3.dot(delta, separatingNormal) > 0.0) vec3.negate(separatingNormal, separatingNormal)
    return true
}


const clipAgainstHull = (context, hullA, positionA, quaternionA, hullB, positionB, quaternionB, separatingNormal, minDistance, maxDistance, out = []) => {
    const { vec3Pool, worldNormalsA, worldNormalsB, worldVerticesB, worldVerticesA, contactPoints } = context
    
    let minDot = Number.MAX_VALUE,
        maxDot = -Number.MAX_VALUE,
        minFaceIndex = -1,
        maxFaceIndex = -1
    for(let i = worldNormalsB.length - 1; i >= 0; i--){
        let dot = vec3.dot(worldNormalsB[i], separatingNormal)
        if(dot <= maxDot) continue
        maxDot = dot
        maxFaceIndex = i
    }
    for(let i = worldNormalsA.length - 1; i >= 0; i--){
        let dot = vec3.dot(worldNormalsA[i], separatingNormal)
        if(dot >= minDot) continue
        minDot = dot
        minFaceIndex = i
    }
    const faceA = hullA.faces[minFaceIndex],
          faceB = hullB.faces[maxFaceIndex]
    
    let clippedVertices = context.clippedVertices
    for(let i = 0; i < faceB.length; i++)
        clippedVertices.push(worldVerticesB[faceB[i]])
    
    outer: for(let i = 0; i < hullA.faces.length; i++){
        if(i == minFaceIndex) continue
        for(let j = 0; j < hullA.faces[i].length; j++)
        
            if(faceA.indexOf(hullA.faces[i][j]) != -1){

                let planeNormal = worldNormalsA[i],
                    planeConstant = -vec3.dot(hullA.faceNormals[i], hullA.vertices[hullA.faces[i][0]]),
                    planeEquation = planeConstant - vec3.dot(planeNormal, positionA)

                let outVertices = []
                clipFaceAgainstPlane(vec3Pool, clippedVertices, planeNormal, planeEquation, outVertices)
                clippedVertices = outVertices

                continue outer
            }
    }
    
    const normal = worldNormalsA[minFaceIndex],
          planeConstant = -vec3.dot(hullA.faceNormals[minFaceIndex], hullA.vertices[hullA.faces[minFaceIndex][0]]),
          planeEquation = planeConstant - vec3.dot(normal, positionA)
    
    for(let i = 0; i < clippedVertices.length; i++){
        let depth = vec3.dot(normal, clippedVertices[i]) + planeEquation
        if(depth <= minDistance) depth = minDistance
        if(depth > maxDistance) continue
        if(depth > 0) continue
        out.push({
            point: clippedVertices[i],
            normal: normal,
            depth: depth
        })
    }
    return out
}

const clipFaceAgainstPlane = (vec3Pool, vertices, planeNormal, planeConstant, out = []) => {
    if(vertices.length < 2) return out
    
    let prevVertex = vertices[vertices.length-1],
        prevDot = vec3.dot(planeNormal, prevVertex) + planeConstant
    for(let length = vertices.length, i = 0; i < length; i++){
        let vertex = vertices[i],
            dot = vec3.dot(planeNormal, vertex) + planeConstant
        
        if(prevDot < 0 != dot < 0)
            out.push(vec3.lerp(prevVertex, vertex, prevDot / (prevDot - dot), vec3Pool.obtain()))
        if(dot < 0)
            out.push(vec3.copy(vertex, vec3Pool.obtain()))
        prevVertex = vertex
        prevDot = dot
    }
    return out
}

export {clipAgainstHull, findSeparatingAxis, SATContext, clipFaceAgainstPlane}