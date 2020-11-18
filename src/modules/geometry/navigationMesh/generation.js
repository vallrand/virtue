import {logger} from '../../debug/logger'
import {Signal} from '../../util'
import {vec3} from '../../math'
import {intoPolygonList, expand, union, simplify, inwardOffset} from '../csg'
//TODO logger info
const buildConfigurationSpace = function*(solids, options){
    options = Object.assign({
        padding: 1,
        margin: 0,
        steepness: Math.PI/4,
        precision: 1e3,
        nearThreshold: 1e-5
    }, options || {})
    
    let geometry = solids.flatten(),
        combinedGeometry = null
    for(let i = geometry.length - 1; i >= 0; i--){
        const solid = geometry[i] = intoPolygonList(geometry[i])
        if(options.margin) yield* expand(solid, options.margin)
        combinedGeometry = combinedGeometry ? yield* union(combinedGeometry, solid) : solid
    }
    const simplifiedGeometry = yield* simplify(combinedGeometry)
    
    geometry = simplifiedGeometry.filter(polygon => Math.acos(vec3.dot(vec3.AXIS_Y, polygon.plane)) < options.steepness)
    
    logger.info('navigation', `Configuration Space: combined ${combinedGeometry.length} simplified ${simplifiedGeometry.length} final ${geometry.length}`)
    
    const vertexMap = Object.create(null),
          vertices = [],
          polygons = []
    for(let i = geometry.length - 1; i >= 0; i--){
        const polygon = geometry[i]
        polygons[i] = {
            normal: vec3.copy(polygon.plane),
            indices: polygon.vertices.map(vertex => {
                let key = vec3.key(vertex, options.precision)
                let index = vertexMap[key] || (vertexMap[key] = vertices.push(vertex))
                return index - 1
            })
        }
        yield
    }
    for(let i = polygons.length - 1; i >= 0; i--){
        const polygon = polygons[i],
              plane = geometry[i].plane,
              indices = polygon.indices
        for(let i = 0; i < indices.length; i++){
            let vertexA = vertices[indices[i]]
            let vertexB = vertices[indices[(i + 1) % indices.length]]
            let edgeLength = vec3.difference(vertexB, vertexA)
            for(let j = 0; j < vertices.length; j++){
                yield;
                let vertexC = vertices[j]
                if(indices.indexOf(j) != -1) continue
                if(Math.abs(plane[3] - vec3.dot(plane, vertexC)) > options.nearThreshold) continue
                let distance = vec3.difference(vertexC, vertexA),
                    difference = (distance + vec3.difference(vertexB, vertexC))/edgeLength
                if(Math.abs(difference - 1) > options.nearThreshold) continue
                
                indices.splice(i + 1, 0, j)
                edgeLength = distance
                vertexB = vertexC
            }
        }
        yield
    }
    
    if(options.padding)
        yield* inwardOffset(vertices, polygons, options.padding)
    
    return { polygons, vertices }
}

const linkNavigationGeometry = function*({ vertices, polygons }){
    for(let idx = polygons.length - 1; idx >= 0; idx--){
        const polygon = polygons[idx],
              indices = polygon.indices,
              centroid = vec3(0),
              vertexIdxMap = Object.create(null)
        for(let i = indices.length - 1; i >= 0; i--){
            vec3.add(centroid, vertices[indices[i]], centroid)
            vertexIdxMap[indices[i]] = true
        }
        vec3.scale(centroid, 1/indices.length, centroid)
        vec3.round(centroid, 2, centroid)
        let radiusSquared = 0
        for(let i = indices.length - 1; i >= 0; radiusSquared = Math.max(radiusSquared, vec3.differenceSquared(centroid, vertices[indices[i--]])));

        const neighbours = polygons.filter((neighbour, i) => i != idx && neighbour.indices.filter(vertexIdx => vertexIdxMap[vertexIdx]).length >= 2)

        Object.assign(polygon, { centroid, neighbours, boundingRadius: Math.sqrt(radiusSquared) })
        yield
    }
    return { vertices, polygons }
}

export {buildConfigurationSpace, linkNavigationGeometry}