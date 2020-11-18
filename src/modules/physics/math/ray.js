//TODO ray utility functions - not used right now
import {vec3} from './vec3'
import {aquireVec3Pool} from '../math'
import {Pool} from '../../util'
import {quat} from './quat'
import {AABB} from './aabb'

const Ray = (origin = vec3(), target = vec3()) => ({
    origin, target,
    direction: vec3.normalize(vec3.subtract(target, origin)),
    length: vec3.difference(target, origin)
})
Ray.precision = 0.0001

Ray.computeAABB = (ray, out = AABB()) => {
    vec3.min(ray.origin, ray.target, out.lowerBound)
    vec3.max(ray.origin, ray.target, out.upperBound)
    return out
}

const IntersectionManifold = () => ({
    intersectionPoint: vec3(),
    intersectionNormal: vec3(),
    distance: 0
})

const Raytracer = (world, intersectionDetector) => {
    const candidates = []
    const intersectionPool = Pool(IntersectionManifold)
    const rayAABB = AABB()
    
    //TODO unfinished functionality
    const context = {
        options: {
            skipBackFaces: true,
            nearest: false
        },
        vec3Pool: null,
        intersectionPoint: vec3(),
        intersectionNormal: vec3(),
        ray: null,
        shape: null,
        body: null,
        intersectionPoints: [],
        clear(){
            //TODO clear options
            if(context.intersectionPoints.length == 0) return
            intersectionPool.release.apply(intersectionPool, context.intersectionPoints)
            context.intersectionPoints.length = 0
        },
        registerIntersection(){
            if(context.options.skipBackFaces && vec3.dot(context.intersectionNormal, context.ray.direction) > 0) return false
            let intersection,
                distance = vec3.difference(context.ray.origin, context.intersectionPoint)
            
            if(context.options.nearest && context.intersectionPoints[0]){
                intersection = context.intersectionPoints[0]
                if(intersection.distance < distance) return false
            }else{
                intersection = intersectionPool.obtain()
                context.intersectionPoints.push(intersection)
                //TODO sort by distance
            }
            
            vec3.copy(context.intersectionPoint, intersection.intersectionPoint)
            vec3.copy(context.intersectionNormal, intersection.intersectionNormal)
            intersection.distance = distance
            
            return intersection
        }
    }
    
    const worldPosition = vec3()
    const worldRotation = quat()
    
    return (ray, options) => {
        context.clear()
        context.ray = ray
        Object.assign(context.options, options)
        
        const vec3Pool = context.vec3Pool = aquireVec3Pool()
        Ray.computeAABB(ray, rayAABB)
        candidates.length = 0
    
        const bodies = world.broadphase.aabbQuery ? world.broadphase.aabbQuery(rayAABB, candidates) : world.bodies
        for(let i = bodies.length - 1; i >= 0; i--){
            let body = context.body = bodies[i]
            if(body.dynamic) continue //TODO configure for dynamic objects as well
            for(let j = body.shapes.length - 1; j >= 0; j--){
                quat.multiply(body.quaternion, body.shapeOrientations[j], worldRotation)
                vec3.transformQuat(body.shapeOffsets[j], body.quaternion, worldPosition)
                vec3.add(body.position, worldPosition, worldPosition)
                let shape = context.shape = body.shapes[j]

                vec3.subtract(worldPosition, ray.origin, vec3.temp)
                vec3.scale(ray.direction, vec3.dot(vec3.temp, ray.direction), vec3.temp)
                vec3.add(ray.origin, vec3.temp, vec3.temp)
                let distance = vec3.difference(vec3.temp, worldPosition) //TODO optimise

                if(distance > shape.boundingSphereRadius) continue

                let intersectMethod = intersectionDetector[shape.type] //TODO clear vec3Pool after each detector call
                if(!intersectMethod) continue

                intersectMethod.call(null, context, shape, worldPosition, worldRotation, ray)
            }
        }

        vec3Pool.release()
        return context.intersectionPoints
    }
}

const rayPlane = (context, shape, worldPosition, worldRotation, ray) => {
    const { intersectionPoint, intersectionNormal } = context
    const vec3Pool = context.vec3Pool
    vec3.transformQuat(vec3.AXIS_Z, worldRotation, intersectionNormal)
    let distance = vec3.subtract(ray.origin, worldPosition, vec3Pool.obtain())
    let planeOrigin = vec3.dot(intersectionNormal, vec3.subtract(ray.origin, worldPosition, vec3.temp))
    let planeTarget = vec3.dot(intersectionNormal, vec3.subtract(ray.target, worldPosition, vec3.temp))
    if(planeOrigin * planeTarget > 0) return false
    
    if(vec3.differenceSquared(ray.origin, ray.target) < planeOrigin * planeOrigin) return false
    let dot = vec3.dot(intersectionNormal, ray.direction)
    if(Math.abs(dot) < Ray.precision) return false
    
    vec3.scale(ray.direction, -planeOrigin / dot, intersectionPoint)
    vec3.add(ray.origin, intersectionPoint, intersectionPoint)
    
    context.registerIntersection()
    return true
}

const raySphere = (context, shape, worldPosition, worldRotation, ray) => {
    const { intersectionPoint, intersectionNormal } = context
    const vec3Pool = context.vec3Pool,
          radius = shape.radius,
          direction = vec3.subtract(ray.target, ray.origin, vec3Pool.obtain()),
          sphereOrigin = vec3.subtract(ray.origin, worldPosition, vec3Pool.obtain())
    
    let a = vec3.dot(direction, direction)
    let b = 2 * vec3.dot(direction, sphereOrigin)
    let c = vec3.dot(sphereOrigin, sphereOrigin) - radius * radius
    
    const delta = b * b - 4 * a * c
    if(delta < 0) return false
    else if(delta === 0){
        vec3.lerp(ray.origin, ray.target, delta, intersectionPoint)
        vec3.subtract(intersectionPoint, worldPosition, intersectionNormal)
        vec3.normalize(intersectionNormal, intersectionNormal)
        context.registerIntersection()
        return true
    }
    const delta0 = (-b - Math.sqrt(delta)) / (2 * a)
    if(delta0 >= 0 && delta0 <= 1){
        vec3.lerp(ray.origin, ray.target, delta0, intersectionPoint)
        vec3.subtract(intersectionPoint, worldPosition, intersectionNormal)
        vec3.normalize(intersectionNormal, intersectionNormal)
        context.registerIntersection()
    }
    const delta1 = (-b + Math.sqrt(delta)) / (2 * a)
    if(delta1 >= 0 && delta1 <= 1){
        vec3.lerp(ray.origin, ray.target, delta1, intersectionPoint)
        vec3.subtract(intersectionPoint, worldPosition, intersectionNormal)
        vec3.normalize(intersectionNormal, intersectionNormal)
        context.registerIntersection()
    }
    return true
}

function pointInTriangle(p, a, b, c){
    const x0 = c[0] - a[0], y0 = c[1] - a[1], z0 = c[2] - a[2],
          x1 = b[0] - a[0], y1 = b[1] - a[1], z1 = b[2] - a[2],
          x2 = p[0] - a[0], y2 = p[1] - a[1], z2 = p[2] - a[2],
          dot00 = x0*x0 + y0*y0 + z0*z0,
          dot01 = x0*x1 + y0*y1 + z0*z1,
          dot02 = x0*x2 + y0*y2 + z0*z2,
          dot11 = x1*x1 + y1*y1 + z1*z1,
          dot12 = x1*x2 + y1*y2 + z1*z2
    
    const u = dot11 * dot02 - dot01 * dot12
    if(u < 0) return false
    const v = dot00 * dot12 - dot01 * dot02
    if(v < 0) return false
    return u + v < dot00 * dot11 - dot01 * dot01
}

const rayConvex = (context, shape, worldPosition, worldRotation, ray) => {
    const { intersectionPoint, intersectionNormal } = context
    const vec3Pool = context.vec3Pool,
          faces = shape.faces,
          vertices = shape.vertices,
          faceNormals = shape.faceNormals,
          worldVertices = Array(vertices.length)
    
    for(let i = vertices.length - 1; i >= 0; i--){
        let vertex = worldVertices[i] = vec3Pool.obtain()
        vec3.copy(vertices[i], vertex)
        vec3.transformQuat(vertex, worldRotation, vertex)
        vec3.add(vertex, worldPosition, vertex)
    }
    
    for(let i = 0; i < faces.length; i++){
        let face = faces[i]
        let faceNormal = faceNormals[i]
        
        vec3.transformQuat(faceNormal, worldRotation, intersectionNormal)
        let dot = vec3.dot(ray.direction, intersectionNormal)
        if(Math.abs(dot) < Ray.precision) continue
        
        let vertexA = worldVertices[face[0]]
        vec3.subtract(vertexA, ray.origin, intersectionPoint)
        let scalar = vec3.dot(intersectionNormal, intersectionPoint) / dot

        if(scalar < 0 || scalar > ray.length) continue

        vec3.scale(ray.direction, scalar, intersectionPoint)
        vec3.add(ray.origin, intersectionPoint, intersectionPoint)

        for(var f = 1; f < face.length - 1; f++){
            let vertexB = worldVertices[face[f]]
            let vertexC = worldVertices[face[f+1]]
            if(pointInTriangle(intersectionPoint, vertexA, vertexB, vertexC) || pointInTriangle(intersectionPoint, vertexB, vertexA, vertexC)){
                context.registerIntersection()
                break
            }
        }
    }
}

const rayBox = (context, shape, worldPosition, worldRotation, ray) => {
    const {intersectionPoint, intersectionNormal} = context
    const vec3Pool = context.vec3Pool
    const halfExtents = shape.halfExtents
    
    const axisX = vec3.transformQuat(vec3.AXIS_X, worldRotation, vec3Pool.obtain())
    const axisY = vec3.transformQuat(vec3.AXIS_Y, worldRotation, vec3Pool.obtain())
    const axisZ = vec3.transformQuat(vec3.AXIS_Z, worldRotation, vec3Pool.obtain())
    
    const rayOrigin = vec3.subtract(ray.origin, worldPosition, vec3Pool.obtain())
    const rayPlane = vec3Pool.obtain()

    const dotX = vec3.dot(ray.direction, axisX)
    const dotY = vec3.dot(ray.direction, axisY)
    const dotZ = vec3.dot(ray.direction, axisZ)
    
    let maxX = -vec3.dot(vec3.subtract(rayOrigin, vec3.scale(axisX, halfExtents[0], rayPlane), rayPlane), axisX) / dotX
    let minX = -vec3.dot(vec3.subtract(rayOrigin, vec3.scale(axisX, -halfExtents[0], rayPlane), rayPlane), axisX) / dotX
    
    let maxY = -vec3.dot(vec3.subtract(rayOrigin, vec3.scale(axisY, halfExtents[1], rayPlane), rayPlane), axisY) / dotY
    let minY = -vec3.dot(vec3.subtract(rayOrigin, vec3.scale(axisY, -halfExtents[1], rayPlane), rayPlane), axisY) / dotY
    
    let maxZ = -vec3.dot(vec3.subtract(rayOrigin, vec3.scale(axisZ, halfExtents[2], rayPlane), rayPlane), axisZ) / dotZ
    let minZ = -vec3.dot(vec3.subtract(rayOrigin, vec3.scale(axisZ, -halfExtents[2], rayPlane), rayPlane), axisZ) / dotZ
    
    if(maxX < 0 && minX < 0) return false
    if(maxY < 0 && minY < 0) return false
    if(maxZ < 0 && minZ < 0) return false
    
    let minmax = Infinity
    let maxmin = -Infinity
    
    planeX: {
        if(Math.abs(dotX) < Ray.precision) break planeX        
        if(maxX < minX){
            if(minX < minmax){
                minmax = minX
            }
            if(maxX > maxmin){
                maxmin = maxX
                vec3.copy(axisX, intersectionNormal)
            }
        }else{
            if(maxX < minmax){
                minmax = maxX
            }
            if(minX > maxmin){
                maxmin = minX
                vec3.negate(axisX, intersectionNormal)
            }
        }
    }
    planeY: {
        if(Math.abs(dotY) < Ray.precision) break planeY
        if(maxY < minY){
            if(minY < minmax){
                minmax = minY
            }
            if(maxY > maxmin){
                maxmin = maxY
                vec3.copy(axisY, intersectionNormal)
            }
        }else{
            if(maxY < minmax){
                minmax = maxY
            }
            if(minY > maxmin){
                maxmin = minY
                vec3.negate(axisY, intersectionNormal)
            }
        }
    }
    planeZ: {
        if(Math.abs(dotZ) < Ray.precision) break planeZ
        if(maxZ < minZ){
            if(minZ < minmax){
                minmax = minZ
            }
            if(maxZ > maxmin){
                maxmin = maxZ
                vec3.copy(axisZ, intersectionNormal)
            }
        }else{
            if(maxZ < minmax){
                minmax = maxZ
            }
            if(minZ > maxmin){
                maxmin = minZ
                vec3.negate(axisZ, intersectionNormal)
            }
        }
    }
    
    if(maxmin >= minmax || maxmin < 0) return false
    vec3.add(ray.origin, vec3.scale(ray.direction, maxmin), intersectionPoint)
    context.registerIntersection()
    return true
}

export { Ray, Raytracer, rayConvex, raySphere, rayPlane, rayBox }