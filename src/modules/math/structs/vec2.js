import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'

const vec2 = (...args) => new Float32Array(args.length ? (args.length === 2 ? args : Array(2).fill(args[0])) : 2)

vec2.copy = unrollVectorUnaryOperator(2, vec2, '')
vec2.scale = unrollVectorScalarOperator(2, vec2, '*')

vec2.add = unrollVectorBinaryOperator(2, vec2, '+')
vec2.subtract = unrollVectorBinaryOperator(2, vec2, '-')
vec2.multiply = unrollVectorBinaryOperator(2, vec2, '*')
vec2.divide = unrollVectorBinaryOperator(2, vec2, '/')
vec2.min = unrollVectorBinaryOperator(2, vec2, 'Math.min', true)
vec2.max = unrollVectorBinaryOperator(2, vec2, 'Math.max', true)

vec2.sqrtLength = v => v[0]*v[0] + v[1]*v[1]
vec2.distance = v => Math.sqrt(vec2.sqrtLength(v))

vec2.normalize = (v, out = vec2()) => {
	const x = v[0], y = v[1],
          sqrt = Math.sqrt(x*x + y*y),
          invSqrt = sqrt ? 1.0 / sqrt : 0
	out[0] = x * invSqrt
	out[1] = y * invSqrt
	return out
}

vec2.dot = (a, b) => a[0] * b[0] + a[1] * b[1]

vec2.lerp = (a, b, f, out = vec2()) => {
	const ax = a[0], ay = a[1]
	out[0] = ax + f * (b[0] - ax)
	out[1] = ay + f * (b[1] - ay)
	return out
}

vec2.direction = (angle, scale = 1, out = vec2()) => {
	out[0] = Math.cos(angle) * scale
	out[1] = Math.sin(angle) * scale
	return out
}

vec2.truncate = (v, maxLength, out = vec2()) => {
    const scale = Math.min(maxLength / vec2.distance(v), 1.0)
    out[0] = scale * v[0]
    out[1] = scale * v[1]
    return out
}
vec2.ZERO = vec2()

vec2.rotation = v => Math.atan2(v[1], v[0])
vec2.fromAngle = (angle, length, out = vec2()) => {
    out[0] = Math.cos(angle) * length
    out[1] = Math.sin(angle) * length
    return out
}
vec2.angle = (a, b) => Math.atan2(a[0]*b[1] - a[1]*b[0], a[0]*b[0] + a[1]*b[1])
vec2.rotate = (vec, angle, out = vec2()) => {
	out[0] = Math.cos(angle)*vec[0] - Math.sin(angle)*vec[1]
	out[1] = Math.sin(angle)*vec[0] + Math.cos(angle)*vec[1]
	return out
}
export {vec2}

