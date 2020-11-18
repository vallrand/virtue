import {vec3, vec4} from '../../math'
import {constructPolygonPlane} from './util'

const Polygon = (vertices, plane) => ({
    vertices,
    plane: plane ? vec4.copy(plane) : constructPolygonPlane(vertices)
})

const intoPolygonList = ({ vertices, faces }) => faces.map(face => Polygon(face.map(index => vertices[index])))

const PLANE_NEAR_TOLERANCE = 1e-4, //TODO make this bsp tree optional parameter?
      COPLANAR = 0,
      FRONT = 1, 
      BACK = 2,
      SPANNING = 3

const splitPolygonByPlane = (plane, polygon, coplanarFront, coplanarBack, front, back) => {
    const dot = vec3.dot(plane, polygon.plane)
    let polygonSide = 0
    const vertexSides = polygon.vertices.map(vertex => {
        let distance = vec3.dot(plane, vertex) - plane[3]
        let side = distance < -PLANE_NEAR_TOLERANCE && BACK || distance > PLANE_NEAR_TOLERANCE && FRONT || COPLANAR
        polygonSide |= side
        return side
    })
    
    switch(polygonSide){
        case COPLANAR: (dot > 0 ? coplanarFront : coplanarBack).push(polygon); break
        case FRONT: front.push(polygon); break
        case BACK: back.push(polygon); break
        case SPANNING:
            const frontVertices = [], backVertices = []
            for(let length = polygon.vertices.length, i = 0, j = length - 1; i < length; j = i++){
                let sideA = vertexSides[j], sideB = vertexSides[i],
                    vertexA = polygon.vertices[j], vertexB = polygon.vertices[i]
                if(sideA != BACK) frontVertices.push(vertexA)
                if(sideA != FRONT) backVertices.push(vertexA)
                if((sideA | sideB) === SPANNING){
                    let factor = (plane[3] - vec3.dot(plane, vertexA)) / vec3.dot(plane, vec3.subtract(vertexB, vertexA, vec3.temp))
                    let middleVertex = vec3.lerp(vertexA, vertexB, factor, vec3())
                    frontVertices.push(middleVertex)
                    backVertices.push(middleVertex)
                }
            }
            frontVertices.length >= 3 && front.push(Polygon(frontVertices, polygon.plane))
            backVertices.length >= 3 && back.push(Polygon(backVertices, polygon.plane))
            break
    }
}

const BSPNode = _ => {
    const node = Object.create(BSPNode.prototype)
    node.plane = null
    node.front = null
    node.back = null
    node.nodePolygons = []
    return node
}

Object.assign(BSPNode, {
    insertPolygons: function*(root, polygons){
        const stack = [root, polygons]
        while(stack.length){
            let polygonList = stack.pop(),
                node = stack.pop()
            if(!polygonList.length) continue
            if(!node.plane){
                let splittingPolygon = polygonList.shift()
                node.nodePolygons.push(splittingPolygon)
                node.plane = vec4.copy(splittingPolygon.plane)
            }
            const front = [], back = []
            for(let i = polygonList.length - 1; i >= 0; i--)
                splitPolygonByPlane(node.plane, polygonList[i], node.nodePolygons, node.nodePolygons, front, back)
            if(front.length) stack.push(node.front = (node.front || BSPNode()), front)
            if(back.length) stack.push(node.back = (node.back || BSPNode()), back)
            yield
        }
    },
    fetchPolygons: function*(root){
        let out = [],
            stack = [root]
        while(stack.length){
            let node = stack.pop()
            out = out.concat(node.nodePolygons)
            if(node.front) stack.push(node.front)
            if(node.back) stack.push(node.back)
            yield
        }
        return out
    },
    invert: function*(root){
        const stack = [root]
        while(stack.length){
            const node = stack.pop()
            node.nodePolygons.forEach(polygon => {
                polygon.vertices.reverse()
                vec4.negate(polygon.plane, polygon.plane)
            })
            vec4.negate(node.plane, node.plane)
            const swap = node.front
            node.front = node.back
            node.back = swap
            
            node.front && stack.push(node.front)
            node.back && stack.push(node.back)
            yield
        }
    },
    clipTo: function*(root, bspNode, clipCoplanar){
        const outerStack = [root],
              innerStack = []
        while(outerStack.length){
            const node = outerStack.pop()
            if(node.front) outerStack.push(node.front)
            if(node.back) outerStack.push(node.back)
            let clippedPolygons = []
            innerStack.push(bspNode, node.nodePolygons)
            while(innerStack.length){
                const polygons = innerStack.pop()
                const clippingNode = innerStack.pop()
                let front = [], coplanarFront = [], back = []
                for(let i = polygons.length - 1; i >= 0; i--)
                    splitPolygonByPlane(clippingNode.plane, polygons[i], clipCoplanar ? back : front, back, front, back)
                if(clippingNode.front) innerStack.push(clippingNode.front, front)
                else clippedPolygons = clippedPolygons.concat(front)
                if(clippingNode.back) innerStack.push(clippingNode.back, back)
                yield
            }
            node.nodePolygons = clippedPolygons
        }
    }
})


export {BSPNode, Polygon, intoPolygonList, splitPolygonByPlane}