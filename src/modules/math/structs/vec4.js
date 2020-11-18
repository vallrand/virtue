import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'

const vec4 = (...args) => new Float32Array(args.length ? (args.length === 4 ? args : Array(4).fill(args[0])) : 4)

vec4.copy = unrollVectorUnaryOperator(4, vec4, '')

vec4.scale = unrollVectorScalarOperator(4, vec4, '*')

vec4.add = unrollVectorBinaryOperator(4, vec4, '+')
vec4.subtract = unrollVectorBinaryOperator(4, vec4, '-')
vec4.multiply = unrollVectorBinaryOperator(4, vec4, '*')
vec4.divide = unrollVectorBinaryOperator(4, vec4, '/')

vec4.sqrtLength = v => v[0]*v[0] + v[1]*v[1] + v[2]*v[2] + v[3]*v[3]

vec4.distance = v => Math.sqrt(vec4.sqrtLength(v))

vec4.dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]

vec4.lerp = (a, b, f, out = vec4()) => {
	const ax = a[0], ay = a[1], az = a[2], aw = a[3]
	out[0] = ax + f * (b[0] - ax)
	out[1] = ay + f * (b[1] - ay)
	out[2] = az + f * (b[2] - az)
	out[3] = aw + f * (b[3] - aw)
	return out
}

vec4.normalize = (v, out = vec4()) => {
	const x = v[0], y = v[1], z = v[2], w = v[3],
          sqrt = Math.sqrt(x*x + y*y + z*z + w*w),
          invSqrt = sqrt ? 1.0 / sqrt : 0
	out[0] = x * invSqrt
	out[1] = y * invSqrt
	out[2] = z * invSqrt
	out[3] = w * invSqrt
	return out
}

vec4.transform = (v, m, out = vec4()) => {
    const x = v[0], y = v[1], z = v[2], w = v[3] === undefined ? 1 : v[3]
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w
    return out
}

vec4.transformQuat = (v, q, out = vec4()) => {
    const x = v[0], y = v[1], z = v[2],
          rx = q[0], ry = q[1], rz = q[2], rw = q[3],
          ix = rw * x + ry * z - rz * y,
          iy = rw * y + rz * x - rx * z,
          iz = rw * z + rx * y - ry * x,
          iw = -rx * x - ry * y - rz * z
    
    out[0] = ix * rw + iw * -rx + iy * -rz - iz * -ry
    out[1] = iy * rw + iw * -ry + iz * -rx - ix * -rz
    out[2] = iz * rw + iw * -rz + ix * -ry - iy * -rx
    out[3] = v[3] === undefined ? 1 : v[3]
    return out
}

export {vec4}