import {EPSILON, vec3} from '../../math'

vec3.MAX = vec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE)
vec3.MIN = vec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE)

vec3.temp = vec3()

vec3.AXIS_X = vec3(1,0,0)
vec3.AXIS_Y = vec3(0,1,0)
vec3.AXIS_Z = vec3(0,0,1)

vec3.ZERO = vec3(0)
vec3.ONE = vec3(1)

vec3.set = (x, y, z, out = vec3()) => {
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}

vec3.distanceSquared = v => {
    const x = v[0], y = v[1], z = v[2]
    return x*x + y*y + z*z
}

vec3.distance = v => {
    let x = v[0], y = v[1], z = v[2]
    return Math.sqrt(x*x + y*y + z*z)
}

vec3.differenceSquared = (a, b) => {
    const dx = a[0] - b[0],
          dy = a[1] - b[1],
          dz = a[2] - b[2]
    return dx*dx + dy*dy + dz*dz
}

vec3.difference = (a, b) => {
    const dx = a[0] - b[0],
          dy = a[1] - b[1],
          dz = a[2] - b[2]
    return Math.sqrt(dx*dx + dy*dy + dz*dz)
}

vec3.transformMat3 = (v, m, out = vec3()) => {
    const x = v[0], y = v[1], z = v[2]
    out[0] = m[0]*x + m[1]*y + m[2]*z
    out[1] = m[3]*x + m[4]*y + m[5]*z
    out[2] = m[6]*x + m[7]*y + m[8]*z
    return out
}

vec3.negate = (v, out = vec3()) => {
    out[0] = -v[0]
    out[1] = -v[1]
    out[2] = -v[2]
    return out
}

vec3.extractTangents = (normal, tangent, binormal) => { //TODO refactor?
    //TODO wrong? why? assumes tangent obj !== binormal obj
    vec3.normalize(normal, binormal)
    if(Math.abs(binormal[0]) < 0.9)
        vec3.cross(binormal, vec3.AXIS_X, tangent)
    else
        vec3.cross(binormal, vec3.AXIS_Y, tangent)
    vec3.cross(binormal, tangent, binormal)
}

vec3.equals = (a, b) => Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON && Math.abs(a[2] - b[2]) <= EPSILON

export {vec3}