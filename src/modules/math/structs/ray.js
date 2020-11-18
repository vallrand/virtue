import {EPSILON} from '../constants'
import {mat4} from './mat4'
import {vec3} from './vec3'
import {vec4} from './vec4'

const Ray = (origin, direction) => ({ origin, direction })

Ray.fromProjectionCamera = (camera, coords) => {
    const origin = vec3.copy(camera.position)
    //:::ALTERNATIVE:::
    //const direction = vec4(coords[0], coords[1], -1, 1)
    //vec4.transform(direction, mat4.invert(camera.projectionMatrix), direction)
    //direction[2] = -1
    //direction[3] = 0
    //vec4.transform(direction, mat4.invert(camera.viewMatrix), direction)
    //vec3.normalize(direction, direction)
    const invViewProjectionMatrix = mat4.invert(mat4.multiply(camera.projectionMatrix, camera.viewMatrix))
    const direction = vec3(coords[0], coords[1], 0.5)
    vec3.unproject(direction, invViewProjectionMatrix, direction)
    vec3.subtract(direction, origin, direction)
    vec3.normalize(direction, direction)
    return Ray(origin, direction)
}

Ray.fromOrthographicCamera = (camera, coords) => {
    //TODO orthographic projection
}

Ray.intersectSphere = (ray, sphere) => {
    const v0 = vec3.subtract(sphere.center, ray.origin),
          tca = vec3.dot(v0, ray.direction),
          distSq = vec3.dot(v0, v0) - tca * tca,
          radiusSq = sphere.radius * sphere.radius
    if(distSq > radiusSq) return null
    const thc = Math.sqrt(radiusSq - distSq),
          t0 = tca - thc,
          t1 = tca + thc
    if(t0 < 0 && t1 < 0) return null
    return t0 < 0 ? t1 : t0 //TODO: evaluate - vec3.add(ray.origin, vec3.scale(ray.direction, t))
}

Ray.pointDistance = (ray, point) => {
    const temp = vec3.subtract(point, ray.origin),
          directionDistance = vec3.dot(temp, ray.direction)
    if(directionDistance < 0) return vec3.distance(temp)
    vec3.scale(ray.direction, directionDistance, temp)
    vec3.add(temp, ray.origin, temp)
    vec3.subtract(temp, point, temp)
    return vec3.distance(temp)
}

Ray.sphereIntersection = (ray, sphere) => Ray.pointDistance(ray, sphere.center) <= sphere.radius

Ray.intersectTriangle = (ray, a, b, c) => {
    const ab = vec3.subtract(b, a)
    const ac = vec3.subtract(c, a)
    const normal = vec3.cross(ab, ac)
    vec3.normalize(normal, normal)
    if(vec3.dot(normal, ray.direction) > 0) return null
    const t = vec3.dot(normal, vec3.subtract(a, ray.origin)) / vec3.dot(normal, ray.direction)
    if(t <= 0) return null
    
    let hit = vec3.scale(ray.direction, t)
    vec3.add(hit, ray.origin, hit)
    let toHit = vec3.subtract(hit, a)
    let dot00 = vec3.dot(ac,ac)
    let dot01 = vec3.dot(ac,ab)
    let dot02 = vec3.dot(ac,toHit)
    let dot11 = vec3.dot(ab,ab)
    let dot12 = vec3.dot(ab,toHit)
    let divide = dot00 * dot11 - dot01 * dot01
    let u = (dot11 * dot02 - dot01 * dot12) / divide
    let v = (dot00 * dot12 - dot01 * dot02) / divide
    if (u >= 0 && v >= 0 && u + v <= 1)
        //return new HitTest(t, hit, normal)
        return true
}

Ray.intersectAABB = (ray, aabb) => {
    let tmin = vec3.subtract(aabb.min, ray.origin)
    let tmax = vec3.subtract(aabb.max, ray.origin)
    if(Math.max(tmin[0], tmin[1], tmin[2]) < 0 && Math.min(tmax[0], tmax[1], tmax[2]) > 0) return true //0, origin, ray
    let inv = vec3.divide(vec3(1,1,1), ray.direction)
    vec3.multiply(tmin, inv, tmin)
    vec3.multiply(tmax, inv, tmax)
    let t1 = vec3.min(tmin, tmax)
    let t2 = vec3.max(tmin, tmax)
    let tnear = Math.max(t1[0], t1[1], t1[2])
    let tfar = Math.min(t2[0], t2[1], t2[2])
    if(!(tnear > 0 && tnear < tfar)) return null
    let hit = vec3.add(vec3.scale(ray.direction, tnear), ray.origin)
    let boxmin = vec3.add(aabb.min, vec3(EPSILON))
    let boxmax = vec3.subtract(aabb.max, vec3(EPSILON))
    return true
    //tnear hit, vec3((hit[0] > box_max[0]) - (hit[0] < box_min[0]),(hit[1] > box_max[1]) - (hit[1] < box_min[1]), (hit[2] > box_max[2]) - (hit[2] < box_min[2]))
}

export {Ray}