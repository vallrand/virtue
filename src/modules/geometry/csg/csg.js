import {vec3, vec4} from '../../math'
import {Polygon, BSPNode} from './bsp'
import {constructPolygonPlane, mergeConvexColinearEdges, mergePolygons} from './util'

const union = function*(polygonsA, polygonsB){
    const a = BSPNode(),
          b = BSPNode()
    yield* BSPNode.insertPolygons(a, polygonsA) //TODO separate bsp functions, import them
    yield* BSPNode.insertPolygons(b, polygonsB)
    yield* BSPNode.clipTo(a, b, false)
    yield* BSPNode.clipTo(b, a, true)
    const clippedPolygonsB = yield* BSPNode.fetchPolygons(b)
    yield* BSPNode.insertPolygons(a, clippedPolygonsB)
    const clippedPolygonsA = yield* BSPNode.fetchPolygons(a)
    return clippedPolygonsA
}

const subtract = function*(polygonsA, polygonsB){
    const a = BSPNode(),
          b = BSPNode()
    yield* BSPNode.insertPolygons(a, polygonsA)
    yield* BSPNode.insertPolygons(b, polygonsB)
    yield* BSPNode.invert(a)
    yield* BSPNode.clipTo(a, b, false)
    yield* BSPNode.clipTo(b, a, true)
    const clippedPolygonsB = yield* BSPNode.fetchPolygons(b)
    yield* BSPNode.insertPolygons(a, clippedPolygonsB)
    yield* BSPNode.invert(a)
    const clippedPolygonsA = yield* BSPNode.fetchPolygons(a)
    return clippedPolygonsA
}

const invert = function*(polygons){
    for(let i = polygons.length - 1; i >= 0; i--){
        const polygon = polygons[i]
        polygon.vertices.reverse()
        vec4.negate(polygon.plane, polygon.plane)
        yield
    }
    return polygons
}

const intersect = function*(polygonsA, polygonsB){
    const a = BSPNode(),
          b = BSPNode()
    yield* BSPNode.insertPolygons(a, polygonsA)
    yield* BSPNode.insertPolygons(b, polygonsB)
    yield* BSPNode.invert(a)
    yield* BSPNode.clipTo(b, a, false)
    yield* BSPNode.invert(b)
    yield* BSPNode.clipTo(a, b, false)
    yield* BSPNode.clipTo(b, a, false)
    const clippedPolygonsB = yield* BSPNode.fetchPolygons(b)
    yield* BSPNode.insertPolygons(a, clippedPolygonsB)
    yield* BSPNode.invert(a)
    const clippedPolygonsA = yield* BSPNode.fetchPolygons(a)
    return clippedPolygonsA
}

const expand = function*(polygons, padding = 1){
    const vertices = []
    polygons.forEach(polygon => polygon.vertices.forEach(vertex => vertex.planeList ? vertex.planeList.push(polygon.plane) : (vertices.push(vertex), vertex.planeList = [polygon.plane])))
    
    vertices.forEach(vertex => {
        const averageNormal = vertex.planeList.reduce((average, normal) => vec3.add(average, normal, average), vec3(0))
        vec3.normalize(averageNormal, averageNormal)
        let dot = vec3.dot(averageNormal, vertex.planeList[0])
        vec3.scale(averageNormal, padding/dot, averageNormal)
        vec3.add(vertex, averageNormal, vertex)
        delete vertex.planeList
    })
    
    polygons.forEach(polygon => constructPolygonPlane(polygon.vertices, polygon.plane)) //polygon.plane[3] += padding precision errors are too noticeable, maxDot might be better
    
    return polygons
}

const simplify = function*(polygons, precision = 1e2){    
    const vertexMap = Object.create(null),
          planeMap = Object.create(null)
    for(let i = polygons.length - 1; i >= 0; i--){
        const polygon = polygons[i]
        polygon.vertices = polygon.vertices.map(vertex => {
            let key = vec3.key(vertex, precision)
            return vertexMap[key] || (vertexMap[key] = vertex)
        }).filter((vertex, idx, vertices) => vertices.indexOf(vertex) == idx)    
        yield
    }
    
    for(let i = polygons.length - 1; i >= 0; i--){
        const polygon = polygons[i]
        if(polygon.vertices.length < 3) continue
        let plane = polygon.plane
        let key = vec4.key(plane, precision)
        if(!planeMap[key]) planeMap[key] = []
        planeMap[key].push(polygon)
        yield
    }
    
    const planes = Object.values(planeMap),
          mergedPolygons = []
    for(let i = planes.length - 1; i >= 0; i--){
        const coplanarPolygons = planes[i] 
        for(let i = coplanarPolygons.length - 1; i >= 0; i--)
            for(let polygonA = coplanarPolygons[i], j = i - 1; j >= 0; j--){
                if(i == j) continue
                let polygonB = coplanarPolygons[j],
                    contourUnion = mergePolygons(polygonA.vertices, polygonB.vertices)
                yield
                if(!contourUnion || !(contourUnion = mergeConvexColinearEdges(contourUnion))) continue
                
                polygonA.vertices = contourUnion
                coplanarPolygons.splice(j, 1)
                i--
                j = coplanarPolygons.length
            }
        
        mergedPolygons[i] = coplanarPolygons
    }
        
    return mergedPolygons.flatten()
}

//TODO: handle intersection case, use edge intersection instead of vertex offsetting
//TODO: generate new list of polygons
const inwardOffset = function*(vertices, polygons, offset){
    const vertexOffsets = []
    const prevEdge = vec3(),
          nextEdge = vec3(),
          inwardNormal = vec3()
    
    for(let i = vertices.length - 1; i >= 0; i--){
        const vertexOffset = vertexOffsets[i] = vec3()
        const vertex = vertices[i]
        let adjacent = 0
        
        for(let j = polygons.length - 1; j >= 0; j--){
            const polygon = polygons[j]
            const index = polygon.indices.indexOf(i)
            if(index == -1) continue
            adjacent++
            
            const prevVertex = vertices[polygon.indices[Math.mod(index - 1, polygon.indices.length)]]
            const nextVertex = vertices[polygon.indices[Math.mod(index + 1, polygon.indices.length)]]
            
            vec3.subtract(vertex, prevVertex, prevEdge)
            vec3.subtract(nextVertex, vertex, nextEdge)
            
            vec3.cross(prevEdge, polygon.normal, prevEdge)
            vec3.cross(nextEdge, polygon.normal, nextEdge)
            
            vec3.normalize(prevEdge, prevEdge)
            vec3.normalize(nextEdge, nextEdge)
            
            vec3.add(prevEdge, nextEdge, inwardNormal)
            vec3.normalize(inwardNormal, inwardNormal)
            
            const angle = vec3.angle(inwardNormal, nextEdge)
            
            vec3.scale(inwardNormal, -offset / Math.cos(angle), inwardNormal)
            
            vec3.add(inwardNormal, vertexOffset, vertexOffset)
            
            const planeNormal = vec3.scale(polygon.normal, offset)
            vec3.add(planeNormal, vertexOffset, vertexOffset)
        }
        vec3.scale(vertexOffset, 1 / adjacent, vertexOffset)
        yield
    }
    for(let i = vertexOffsets.length - 1; i >= 0; i--)
        vec3.add(vertexOffsets[i], vertices[i], vertices[i])
}

export {invert, union, subtract, intersect, expand, simplify, inwardOffset}