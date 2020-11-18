import {vec3} from './vec3'

const AABB = _ => ({ lowerBound: vec3(), upperBound: vec3() })

AABB.temp = AABB()

AABB.copy = (aabb, out = AABB()) => {
    vec3.copy(aabb.lowerBound, out.lowerBound)
    vec3.copy(aabb.upperBound, out.upperBound)
    return out
}

AABB.margin = (aabb, margin, out = AABB()) => {
    out.lowerBound[0] = aabb.lowerBound[0] - margin
    out.lowerBound[1] = aabb.lowerBound[1] - margin
    out.lowerBound[2] = aabb.lowerBound[2] - margin
    out.upperBound[0] = aabb.upperBound[0] + margin
    out.upperBound[1] = aabb.upperBound[1] + margin
    out.upperBound[2] = aabb.upperBound[2] + margin
    return out
}

AABB.extend = (a, b, out = AABB()) => {
    vec3.min(a.lowerBound, b.lowerBound, out.lowerBound)
    vec3.max(a.upperBound, b.upperBound, out.upperBound)
    return out
}

AABB.overlap = (a, b) => {
    const minA = a.lowerBound,
          maxA = a.upperBound,
          minB = b.lowerBound,
          maxB = b.upperBound,
          overlapX = (minB[0] <= maxA[0] && maxA[0] <= maxB[0]) || (minA[0] <= maxB[0] && maxB[0] <= maxA[0]),
          overlapY = (minB[1] <= maxA[1] && maxA[1] <= maxB[1]) || (minA[1] <= maxB[1] && maxB[1] <= maxA[1]),
          overlapZ = (minB[2] <= maxA[2] && maxA[2] <= maxB[2]) || (minA[2] <= maxB[2] && maxB[2] <= maxA[2])
    return overlapX && overlapY && overlapZ
}

AABB.volume = aabb => {
    const min = aabb.lowerBound,
          max = aabb.upperBound
    return (max[0] - min[0]) * (max[1] - min[1]) * (max[2] - min[2])
}

AABB.contains = (outer, inner) => {
    const minA = outer.lowerBound,
          maxA = outer.upperBound,
          minB = inner.lowerBound,
          maxB = inner.upperBound
    return minA[0] <= minB[0] && maxB[0] <= maxA[0]
        && minA[1] <= minB[1] && maxB[1] <= maxA[1]
        && minA[2] <= minB[2] && maxB[2] <= maxA[2]
}

AABB.surfaceArea = aabb => {
    const width = aabb.upperBound[0] - aabb.lowerBound[0],
          height = aabb.upperBound[1] - aabb.lowerBound[1],
          depth = aabb.upperBound[2] - aabb.lowerBound[2]
    return 2 * (width * (height + depth) + height * depth)
}

AABB.rayIntersect = (aabb, ray) => { //TODO ray intersection should be separate? Also, we already have the same function!!!
    const direction = ray._direction,
          origin = ray.from,
          lower = aabb.lowerBound,
          upper = aabb.upperBound,
          invX = 1.0 / direction[0],
          invY = 1.0 / direction[1],
          invZ = 1.0 / direction[2],
          t0 = (lower[0] - origin[0]) * invX,
          t1 = (upper[0] - origin[0]) * invX,
          t2 = (lower[1] - origin[1]) * invY,
          t3 = (upper[1] - origin[1]) * invY,
          t4 = (lower[2] - origin[2]) * invZ,
          t5 = (upper[2] - origin[2]) * invZ,
          tMax = Math.min(Math.max(t0, t1), Math.max(t2, t3), Math.max(t4, t5))
    if(tMax < 0) return false
    const tMin = Math.max(Math.min(t0, t1), Math.min(t2, t3), Math.min(t4, t5))
    return tMin <= tMax
}

export {AABB}