import {vec3} from '../../math'

const pointInsidePolygon = (polygon, point, planeNearThreshold = 0.5) => { //TODO refactor, optimise, more generic?
    let flag = false
    let min = Number.MAX_VALUE,
        max = -Number.MAX_VALUE
    for(let i = polygon.length - 1; i >= 0; i--){
        let edgeA = polygon[i],
            edgeB = polygon[(i || polygon.length) - 1]
        min = Math.min(edgeA[1], min)
        max = Math.max(edgeA[1], max)
        if(edgeA[2] > point[2] == edgeB[2] > point[2]) continue
        if((point[0] - edgeA[0]) < (edgeB[0] - edgeA[0]) * (point[2] - edgeA[2]) / (edgeB[2] - edgeA[2]))
        flag = !flag
    }
    if(point[1] > max + planeNearThreshold || point[1] < min - planeNearThreshold) return false
    return flag 
}

const findClosestNode = (position, polygons, vertices, options = {}) => {
    let minDistance = options.maxThreshold || Number.MAX_VALUE,
        closestNode = null
    for(let i = polygons.length - 1; i >= 0; i--){
        let node = polygons[i],
            measuredDistance = vec3.differenceSquared(position, node.centroid)
        if(measuredDistance >= minDistance) continue
        if(options.checkBounds && !pointInsidePolygon(node.indices.map(idx => vertices[idx]), position, options.planeNearThreshold)) continue
        closestNode = node
        minDistance = measuredDistance
    }
    return { distance: minDistance, node: closestNode }
}

const mergeVertices = (vertices, faces, precision = 1e4) => { //TODO defer async
    vertices.forEach(vertex => vec3.round(vertex, 2, vertex))
    const verticesMap = Object.create(null),
          unique = [],
          duplicates = vertices.map((vertex, idx) => {
              let key = vec3.key(vertex, precision)
              return verticesMap[key] || (verticesMap[key] = unique.push(vertex))
          }), polygons = faces.map(face => face.map(idx => duplicates[idx] - 1).filter((idx, i, indices) => indices.indexOf(idx) == i))
    .filter(face => face.length > 2)
    .map(indices => ({
        indices,
        normal: vec3.faceNormal(indices.map(idx => unique[idx]), vec3())
    }))
    return { polygons, vertices }
}

export {pointInsidePolygon, findClosestNode, mergeVertices}