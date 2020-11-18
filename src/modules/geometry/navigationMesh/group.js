import {Signal} from '../../util'
import {sharedPolygonIndices} from '../csg'

const groupNavigationMesh = function*({ vertices, polygons }, options){
    options = Object.assign({
        expectedGroups: 1
    }, options || {})
    
    let groups = [],
        groupCount = 0,
        polygonIdx = polygons.length,
        polygonsToProcess = []
    for(let i = polygons.length - 1; i >= 0; i--){
        let polygon = polygonsToProcess.pop()
        if(!polygon)
            while(polygonIdx--){
                polygon = polygons[polygonIdx]
                if(polygon.group !== undefined) continue
                groups[polygon.group = groupCount++] = []
                break
            }
        groups[polygon.group].push(polygon)
        for(let i = polygon.neighbours.length - 1; i >= 0; i--){
            let neighbour = polygon.neighbours[i]
            if(neighbour.group !== undefined) continue
            neighbour.group = polygon.group
            polygonsToProcess.push(neighbour)
        }
        yield
    }
    groups = groups.sort((a, b) => b.length - a.length).slice(0, options.expectedGroups)
    
    const groupedVertices = []
    for(let group = groups.length - 1; group >= 0; group--){
        const reindexed = [],
              filtered = [],
              polygons = groups[group]
        groups[group] = { polygons, vertices: filtered }
        for(let i = polygons.length - 1; i >= 0; i--){
            const polygon = polygons[i]
            polygon.group = group
            polygon.indices = polygon.indices.map(index => (reindexed[index] || (reindexed[index] = filtered.push(vertices[index]))) - 1)
            yield
        }
    }
    for(let group = groups.length - 1; group >= 0; group--){
        const polygons = groups[group].polygons,
              groupVertices = groups[group].vertices
        for(let i = polygons.length - 1; i >= 0; i--){
            const polygon = polygons[i],
                  neighbours = polygon.neighbours,
                  portals = polygon.portals = []
            for(let j = neighbours.length - 1; j >= 0; j--){
                portals[j] = sharedPolygonIndices(polygon.indices, neighbours[j].indices).map(idx => groupVertices[idx])
                portals[j].splice(1, portals[j].length - 2)
                yield
            }
        }
    }
    
    return groups
}

const findIntersectionLine = function*(normal, indicesA, verticesA, indicesB, verticesB, nearPrecision = 1e-1){ //TODO move to utils
    const edge = vec3(),
          direction = vec3()
    let vertexLeft = null,
        vertexRight = null
    for(let a0 = indicesA.length - 1, a1 = 0; a0 >= 0; a1 = a0--){
        let vertexA0 = verticesA[indicesA[a0]],
            vertexA1 = verticesA[indicesA[a1]]
        vec3.subtract(vertexA1, vertexA0, edge)
        vec3.normalize(edge, edge)
        vec3.cross(edge, normal, direction)
        let planeW = vec3.dot(normal, vertexA0), //TODO keep plane vec4 instead of vec3 normal?
            directionW = vec3.dot(direction, vertexA0)
        for(let b0 = indicesB.length - 1, b1 = 0; b0 >= 0; b1 = b0--){
            let vertexB0 = verticesB[indicesB[b0]],
                vertexB1 = verticesB[indicesB[b1]],
                edgeB = vec3.subtract(vertexB1, vertexB0, vec3())
            if(vec3.dot(edge, edgeB) >= 0) continue
            //TODO not refactored
            if(Math.abs(vec3.dot(normal, vertexB0) - planeW) > nearPrecision) continue //TODO possible duplication
            if(Math.abs(vec3.dot(direction, vertexB0) - directionW) > nearPrecision) continue
            if(Math.abs(vec3.dot(normal, vertexB1) - planeW) > nearPrecision) continue
            if(Math.abs(vec3.dot(direction, vertexB1) - directionW) > nearPrecision) continue

            let dotA = vec3.dot(edge, vertexA0),
                dotB = vec3.dot(edge, vertexA1),
                dotC = vec3.dot(edge, vertexB0),
                dotD = vec3.dot(edge, vertexB1)
            
            if(dotD >= dotB || dotA >= dotC) continue
            
            if(dotA <= dotD && dotB >= dotC) return [vertexB1, vertexB0]
            if(dotA >= dotD && dotB <= dotC) return [vertexA0, vertexA1]
            if(dotA <= dotD && dotB <= dotC) return [vertexB1, vertexA1]
            if(dotA >= dotD && dotB >= dotC) return [vertexA0, vertexB0]
        }
    }
    return null
}

const attachNavigationMesh = function*(existingGroups, navigationMesh){
    if(!existingGroups) return navigationMesh
    
    const prevPolygons = existingGroups.map(group => group.polygons).flatten(),
          polygons = navigationMesh.map(group => group.polygons).flatten()
    
    for(let a = polygons.length - 1; a >= 0; a--)
        for(let polygonA = polygons[a], b = prevPolygons.length - 1; b >= 0; b--){
            let polygonB = prevPolygons[b],
                combinedRadius = polygonA.boundingRadius + polygonB.boundingRadius,
                distanceSquared = vec3.differenceSquared(polygonA.centroid, polygonB.centroid)
            yield
            if(combinedRadius * combinedRadius < distanceSquared) continue
            let portal = yield* findIntersectionLine(polygonA.normal, 
                                                     polygonA.indices, navigationMesh[polygonA.group].vertices, 
                                                     polygonB.indices, existingGroups[polygonB.group].vertices)
            if(!portal) continue
            polygonB.neighbours.push(polygonA)
            polygonA.neighbours.push(polygonB)
            polygonA.portals.push(portal)
            polygonB.portals.push(portal.slice().reverse()),
            (polygonA.joints = polygonA.joint || []).push(polygonB),
            (polygonA.joints = polygonA.joint || []).push(polygonB)
        }
    
    let groupOffset = existingGroups.length
    navigationMesh.forEach(group => group.polygons.forEach(polygon => polygon.group += groupOffset))
    existingGroups.push(...navigationMesh)
    return existingGroups
}

const detachNavigationMesh = function*(existingGroups, group){ //TODO async iteration?
    let idx = existingGroups.indexOf(group)
    if(idx == -1) return existingGroups
    
    group.polygons.filter(polygon => polygon.joint).forEach(polygon => polygon.joints.forEach(jointPolygon => {
            let idx = jointPolygon.neighbours.indexOf(polygon)
            jointPolygon.neighbours.splice(idx, 1)
            jointPolygon.portals.splice(idx, 1)
            jointPolygon.joints.remove(polygon)
            if(!jointPolygon.joints.length) delete jointPolygon.joints
    }))
    
    existingGroups.splice(idx, 1)
    existingGroups.slice(idx).forEach((group, idx) => group.polygons.forEach(polygon => --polygon.group))
    return existingGroups
}

export {groupNavigationMesh, attachNavigationMesh, detachNavigationMesh}