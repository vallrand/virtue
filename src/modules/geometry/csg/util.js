import {vec2, vec3, vec4, quat} from '../../math'

vec3.faceNormal = (a, b, c, out = vec3()) => {
    const ax = a[0] - b[0], ay = a[1] - b[1], az = a[2] - b[2],
          bx = a[0] - c[0], by = a[1] - c[1], bz = a[2] - c[2]
    out[0] = ay * bz - az * by
	out[1] = az * bx - ax * bz
	out[2] = ax * by - ay * bx
    return out
}

vec3.round = (vec, precision, out = vec3()) => {
    out[0] = vec[0].toFixed(precision)
    out[1] = vec[1].toFixed(precision)
    out[2] = vec[2].toFixed(precision)
    return out
}

vec3.angle = (a, b) => Math.acos(Math.clamp(vec3.dot(a, b) / Math.sqrt(vec3.distanceSquared(a) * vec3.distanceSquared(b)), -1, 1))

vec2.key = (vector, precision = 1e3) => `${Math.round(vector[0] * precision)}-${Math.round(vector[1] * precision)}`
vec3.key = (vector, precision = 1e3) => `${Math.round(vector[0] * precision)}-${Math.round(vector[1] * precision)}-${Math.round(vector[2] * precision)}`
vec4.key = (vector, precision = 1e3) => `${Math.round(vector[0] * precision)}-${Math.round(vector[1] * precision)}-${Math.round(vector[2] * precision)}-${Math.round(vector[3] * precision)}`

vec4.negate = (v, out = vec4()) => {
    out[0] = -v[0]
    out[1] = -v[1]
    out[2] = -v[2]
    out[3] = -v[3]
    return out
}

const constructPolygonPlane = (vertices, out = vec4()) => {
    const a = vertices[0], b = vertices[1]
    for(let i = vertices.length - 1; i >= 2; i--)
        if(!vec3.equals(vec3.ZERO, vec3.faceNormal(a, b, vertices[i], out)))
            break
    vec3.normalize(out, out)
    out[3] = vec3.dot(out, a)
    return out
}

//TODO still has some minor artifacts (overlapping extra polygons)
const mergePolygons = (verticesA, verticesB, out = []) => { //TODO optimise somehow, GC unfriendly, handle edge-cases
    const vertices = [],
          indicesA = verticesA.map(vertex => (vertices.indexOf(vertex) + 1 || vertices.push(vertex)) - 1),
          indicesB = verticesB.map(vertex => (vertices.indexOf(vertex) + 1 || vertices.push(vertex)) - 1),
          contourA = [],
          contourB = [],
          edges = []
    if(verticesA.length + verticesB.length - vertices.length < 2) return null
    for(let i = indicesA.length - 1; i >= 0; contourA[indicesA[(i || indicesA.length) - 1]] = indicesA[i--]);
    for(let i = indicesB.length - 1; i >= 0; contourB[indicesB[(i || indicesB.length) - 1]] = indicesB[i--]);
    
    let sharedEdges = contourA.filter((next, prev) => contourB[next] == prev || (edges[prev] = next, false)).length
    if(!sharedEdges) return null
    contourB.forEach((next, prev) => contourA[next] == prev || (edges[prev] = next))
    for(let index = 0, next = edges[index]; next != -1; edges[index] = -1, next = edges[index = next])
        out.push(vertices[index])
    
    if(vertices.length != out.length - sharedEdges + 1) return null
    return out
}

const sharedPolygonIndices = (a, b, out = []) => {
    const indexMap = Object.create(null)
    for(let i = b.length - 1; i >= 0; indexMap[b[i--]] = true);
    let startIndex, value, lengthA = a.length
    for(startIndex = lengthA - 1; startIndex >= 0; startIndex--)
        if(!indexMap[a[(startIndex || lengthA) - 1]] && indexMap[a[startIndex]])
            break
    for(let i = 0; i < lengthA; i++)
        if(indexMap[value = a[(startIndex + i) % lengthA]])
            out.push(value)
    return out
}

const mergeConvexColinearEdges = (vertices, out = [], precision = 1e5) => { //TODO reuse vec3Pool
    const length = vertices.length
    if(length < 3) return false
    let previousEdge = vec3.subtract(vertices[length - 1], vertices[length - 2], vec3()),
        nextEdge = vec3(),
        orientation, angleSum = 0
    for(let i = 0; i < length; i++){
        let vertex = vertices[(i || length) - 1]
        vec3.subtract(vertices[i], vertex, nextEdge)
        let angle = vec3.angle(previousEdge, nextEdge)
        if(Math.round(angle * precision) == 0) continue
        if(!orientation) orientation = Math.sign(angle)
        else if(orientation != Math.sign(angle)) return false
        angleSum += Math.abs(angle)
        out.push(vertex)
        vec3.copy(nextEdge, previousEdge)
    }
    return Math.round(angleSum / (Math.PI * 2)) == 1 ? out : false
}

export {constructPolygonPlane, mergeConvexColinearEdges, mergePolygons, sharedPolygonIndices}