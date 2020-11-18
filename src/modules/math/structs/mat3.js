import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'

const mat3 = (...args) => new Float32Array(args.length ? (args.length === 9 ? args : Array(9).fill(args[0])) : 9)

mat3.copy = unrollVectorUnaryOperator(9, mat3, '')

mat3.identity = (out = mat3()) => {
	out[0] = 1; out[1] = 0; out[2] = 0
	out[3] = 0; out[4] = 1; out[5] = 0
	out[6] = 0; out[7] = 0; out[8] = 1
	return out
}

mat3.transpose = (m, out = mat3()) => {
	if(out === m){
		const tm01 = m[1], tm02 = m[2], tm12 = m[5]
		out[1] = m[3]; out[2] = m[6]
		out[3] = tm01; out[5] = m[7]
		out[6] = tm02; out[7] = tm12
	}else{
		out[0] = m[0]; out[1] = m[3]; out[2] = m[6]
		out[3] = m[1]; out[4] = m[4]; out[5] = m[7]
		out[6] = m[2]; out[7] = m[5]; out[8] = m[8]
	}
	return out
}

mat3.invert = (m, out = mat3()) => {
	const m00 = m[0], m01 = m[1], m02 = m[2],
		  m10 = m[3], m11 = m[4], m12 = m[5],
		  m20 = m[6], m21 = m[7], m22 = m[8],
		  d01 = m22 * m11 - m12 * m21,
		  d11 = m12 * m20 - m22 * m10,
		  d21 = m21 * m10 - m11 * m20,
          det = (m00 * d01 + m01 * d11 + m02 * d21),
		  invDet = det ? 1.0 / det : 0
	out[0] = invDet * d01
	out[1] = invDet * (m02 * m21 - m22 * m01)
	out[2] = invDet * (m12 * m01 - m02 * m11)
	out[3] = invDet * d11
	out[4] = invDet * (m22 * m00 - m02 * m20)
	out[5] = invDet * (m02 * m10 - m12 * m00)
	out[6] = invDet * d21
	out[7] = invDet * (m01 * m20 - m21 * m00)
	out[8] = invDet * (m11 * m00 - m01 * m10)
	return out
}

mat3.fromQuat = (q, out = mat3()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3],
          x2 = 2 * x,   y2 = 2 * y,     z2 = 2 * z,
          xx = x * x2,  yy = y * y2,    zz = z * z2,
          yx = x * y2,  zx = x * z2,    zy = y * z2,
          wx = w * x2,  wy = w * y2,    wz = w * z2
    out[0] = 1 - yy - zz;     out[1] = yx + wz;       out[2] = zx - wy
    out[3] = yx - wz;         out[4] = 1 - xx - zz;   out[5] = zy + wx
    out[6] = zx + wy;         out[7] = zy - wx;       out[8] = 1 - xx - yy
    return out
}

mat3.fromMat4 = (m, out = mat3()) => {
    out[0] = m[0]; out[1] = m[1]; out[2] = m[2]
    out[3] = m[4]; out[4] = m[5]; out[5] = m[6]
    out[6] = m[8]; out[7] = m[9]; out[8] = m[10]
    return out
}

mat3.multiply = (m1, m2, out = mat3()) => {
    const m00 = m1[0], m01 = m1[1], m02 = m1[2],
          m10 = m1[3], m11 = m1[4], m12 = m1[5],
          m20 = m1[6], m21 = m1[7], m22 = m1[8]
    let by0 = m2[0], by1 = m2[1], by2 = m2[2]
    out[0] = by0 * m00 + by1 * m10 + by2 * m20
    out[1] = by0 * m01 + by1 * m11 + by2 * m21
    out[2] = by0 * m02 + by1 * m12 + by2 * m22
    by0 = m2[3], by1 = m2[4], by2 = m2[5]
    out[3] = by0 * m00 + by1 * m10 + by2 * m20
    out[4] = by0 * m01 + by1 * m11 + by2 * m21
    out[5] = by0 * m02 + by1 * m12 + by2 * m22
    by0 = m2[6], by1 = m2[7], by2 = m2[8]
    out[6] = by0 * m00 + by1 * m10 + by2 * m20
    out[7] = by0 * m01 + by1 * m11 + by2 * m21
    out[8] = by0 * m02 + by1 * m12 + by2 * m22
  return out
}

export {mat3}