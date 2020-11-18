import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'

const vec3 = (...args) => new Float32Array(args.length ? (args.length === 3 ? args : Array(3).fill(args[0])) : 3)

vec3.copy = unrollVectorUnaryOperator(3, vec3, '')
vec3.abs = unrollVectorUnaryOperator(3, vec3, 'Math.abs', true)

vec3.scale = unrollVectorScalarOperator(3, vec3, '*')

vec3.add = unrollVectorBinaryOperator(3, vec3, '+')
vec3.subtract = unrollVectorBinaryOperator(3, vec3, '-')
vec3.multiply = unrollVectorBinaryOperator(3, vec3, '*')
vec3.divide = unrollVectorBinaryOperator(3, vec3, '/')
vec3.min = unrollVectorBinaryOperator(3, vec3, 'Math.min', true)
vec3.max = unrollVectorBinaryOperator(3, vec3, 'Math.max', true)

vec3.sqrtLength = v => v[0]*v[0] + v[1]*v[1] + v[2]*v[2]
vec3.distance = v => Math.sqrt(vec3.sqrtLength(v)) //TODO rename magnitude

vec3.manhattan = v => Math.abs(v[0]) + Math.abs(v[1]) + Math.abs(v[2])

vec3.normalize = (v, out = vec3()) => {
	const x = v[0], y = v[1], z = v[2],
          sqrt = Math.sqrt(x*x + y*y + z*z),
          invSqrt = sqrt ? 1.0 / sqrt : 0
	out[0] = x * invSqrt
	out[1] = y * invSqrt
	out[2] = z * invSqrt
	return out
}

vec3.dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

vec3.cross = (a, b, out = vec3()) => {
	const ax = a[0], ay = a[1], az = a[2],
		bx = b[0], by = b[1], bz = b[2]
	out[0] = ay * bz - az * by
	out[1] = az * bx - ax * bz
	out[2] = ax * by - ay * bx
	return out
}

vec3.lerp = (a, b, f, out = vec3()) => {
	const ax = a[0], ay = a[1], az = a[2]
	out[0] = ax + f * (b[0] - ax)
	out[1] = ay + f * (b[1] - ay)
	out[2] = az + f * (b[2] - az)
	return out
}

vec3.transformQuat = (v, q, out = vec3()) => {
    const x = v[0], y = v[1], z = v[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx
    return out
}

vec3.eyeUp = (q, out = vec3()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3]
    out[0] =     2 * (x * y - w * z)
    out[1] = 1 - 2 * (x * x + z * z)
    out[2] =     2 * (y * z + w * x)
    return out
}

vec3.eyeForward = (q, out = vec3()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3]
    out[0] =     2 * (x * z - w * y)
    out[1] =     2 * (y * x + w * x)
    out[2] = 1 - 2 * (x * x + y * y)
    return out
}

vec3.eyeRight = (q, out = vec3()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3]
    out[0] = 1 - 2 * (y * y - z * z)
    out[1] =     2 * (x * y + w * z)
    out[2] =     2 * (x * z + w * y)
    return out
}

vec3.UP = vec3(0, 1, 0)
vec3.LEFT = vec3(1, 0, 0)

vec3.eulerFromMat3 = (mat, order = 'XYZ', out = vec3()) => {
    const m00 = mat[0], m01 = mat[4], m02 = mat[8],
          m10 = mat[1], m11 = mat[5], m12 = mat[9],
          m20 = mat[2], m21 = mat[6], m22 = mat[10]
    if(order === 'XYZ'){
        out[1] = Math.asin(Math.clamp(m02, -1, 1))
        if(Math.abs( m02 ) < 0.99999){
            out[0] = Math.atan2(-m12, m22)
            out[2] = Math.atan2(-m01, m00)
        }else{
            out[0] = Math.atan2(m21, m11)
            out[2] = 0
        }
    }else if( order === 'YXZ'){
        out[0] = Math.asin(-Math.clamp(m12, -1, 1))
        if(Math.abs(m12) < 0.99999){
            out[1] = Math.atan2(m02, m22)
            out[2] = Math.atan2(m10, m11)
        }else{
            out[1] = Math.atan2(-m20, m00)
            out[2] = 0
        }
    }else if(order === 'ZXY'){
        out[0] = Math.asin(Math.clamp(m21, -1, 1))
        if(Math.abs(m21) < 0.99999){
            out[1] = Math.atan2(-m20, m22)
            out[2] = Math.atan2(-m01, m11)
        }else{
            out[1] = 0
            out[2] = Math.atan2(m10, m00)
        }
    }else if(order === 'ZYX'){
        out[1] = Math.asin(-Math.clamp(m20, -1, 1))
        if (Math.abs(m20) < 0.99999){
            out[0] = Math.atan2(m21, m22)
            out[2] = Math.atan2(m10, m00)
        }else{
            out[0] = 0
            out[2] = Math.atan2( -m01, m11)
        }
    }else if(order === 'YZX'){
        out[2] = Math.asin(Math.clamp(m10, -1, 1))
        if(Math.abs(m10) < 0.99999){
            out[0] = Math.atan2( -m12, m11)
            out[1] = Math.atan2( -m20, m00)
        }else{
            out[0] = 0
            out[1] = Math.atan2(m02, m22)
        }
    }else if(order === 'XZY'){
        out[2] = Math.asin( -Math.clamp(m01, -1, 1))
        if (Math.abs(m01) < 0.99999){
            out[0] = Math.atan2(m21, m11)
            out[1] = Math.atan2(m02, m00)
        }else{
            out[0] = Math.atan2( -m12, m22)
            out[1] = 0
        }
    }
    return out
}

vec3.translationFromMat4 = (mat, out = vec3()) => {
    out[0] = mat[12]; out[1] = mat[13]; out[2] = mat[14]
    return out
}

vec3.scaleFromMat4 = (mat, out = vec3()) => {
    const m00 = mat[0], m01 = mat[1], m02 = mat[2],
          m10 = mat[4], m11 = mat[5], m12 = mat[6],
          m20 = mat[8], m21 = mat[9], m22 = mat[10]
    out[0] = Math.sqrt(m00 * m00 + m01 * m01 + m02 * m02)
    out[1] = Math.sqrt(m10 * m10 + m11 * m11 + m12 * m12)
    out[2] = Math.sqrt(m20 * m20 + m21 * m21 + m22 * m22)
    return out
}

vec3.truncate = (v, maxLength, out = vec3()) => {
    const scale = Math.min(maxLength / vec3.distance(v), 1.0)
    out[0] = scale * v[0]
    out[1] = scale * v[1]
    out[2] = scale * v[2]
    return out
}

vec3.unproject = (v, m, out = vec3()) => {
    var x = v[0], y = v[1], z = v[2],
        m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3],
        m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7],
        m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11],
        m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15],
        w = (x * m03 + y * m13 + z * m23 + m33),
        invW = w ? 1/w : 0

    out[0] = (x * m00 + y * m10 + z * m20 + m30) * invW 
    out[1] = (x * m01 + y * m11 + z * m21 + m31) * invW 
    out[2] = (x * m02 + y * m12 + z * m22 + m32) * invW
    return out
}

export {vec3}