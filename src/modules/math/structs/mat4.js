import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'
import {EPSILON} from '../constants'

const mat4 = (...args) => new Float32Array(args.length ? (args.length === 16 ? args : Array(16).fill(args[0])) : 16)

mat4.copy = unrollVectorUnaryOperator(16, mat4, '')

mat4.identity = (out = mat4()) => {
	out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0
	out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0
	out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0
	out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1
	return out
}

mat4.transpose = (m, out = mat4()) => {
	if(out === m){
		const m01 = m[1], m02 = m[2], m03 = m[3], m12 = m[6], m13 = m[7], m23 = m[11]
		out[1] = m[4]; out[2] = m[8]; out[3] = m[12]
		out[4] = m01; out[6] = m[9]; out[7] = m[13]
		out[8] = m02; out[9] = m12; out[11] = m[14]
		out[12] = m03; out[13] = m13; out[14] = m23
	}else{
		out[0] = m[0]; out[1] = m[4]; out[2] = m[8]; out[3] = m[12]
		out[4] = m[1]; out[5] = m[5]; out[6] = m[9]; out[7] = m[13]
		out[8] = m[2]; out[9] = m[6]; out[10] = m[10]; out[11] = m[14]
		out[12] = m[3]; out[13] = m[7]; out[14] = m[11]; out[15] = m[15]
	}
	return out
}

mat4.invert = (m, out = mat4()) => {
	const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3],
	m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7],
	m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11],
	m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15],
	d00 = m00 * m11 - m01 * m10,
	d01 = m00 * m12 - m02 * m10,
	d02 = m00 * m13 - m03 * m10,
	d03 = m01 * m12 - m02 * m11,
	d04 = m01 * m13 - m03 * m11,
	d05 = m02 * m13 - m03 * m12,
	d06 = m20 * m31 - m21 * m30,
	d07 = m20 * m32 - m22 * m30,
	d08 = m20 * m33 - m23 * m30,
	d09 = m21 * m32 - m22 * m31,
	d10 = m21 * m33 - m23 * m31,
	d11 = m22 * m33 - m23 * m32,
    det = (d00 * d11 - d01 * d10 + d02 * d09 + d03 * d08 - d04 * d07 + d05 * d06),
	invDet = det ? 1.0 / det : 0

	out[0] = invDet * (m11 * d11 - m12 * d10 + m13 * d09)
	out[1] = invDet * (m02 * d10 - m01 * d11 - m03 * d09)
	out[2] = invDet * (m31 * d05 - m32 * d04 + m33 * d03)
	out[3] = invDet * (m22 * d04 - m21 * d05 - m23 * d03)
	out[4] = invDet * (m12 * d08 - m10 * d11 - m13 * d07)
	out[5] = invDet * (m00 * d11 - m02 * d08 + m03 * d07)
	out[6] = invDet * (m32 * d02 - m30 * d05 - m33 * d01)
	out[7] = invDet * (m20 * d05 - m22 * d02 + m23 * d01)
	out[8] = invDet * (m10 * d10 - m11 * d08 + m13 * d06)
	out[9] = invDet * (m01 * d08 - m00 * d10 - m03 * d06)
	out[10] = invDet * (m30 * d04 - m31 * d02 + m33 * d00)
	out[11] = invDet * (m21 * d02 - m20 * d04 - m23 * d00)
	out[12] = invDet * (m11 * d07 - m10 * d09 - m12 * d06)
	out[13] = invDet * (m00 * d09 - m01 * d07 + m02 * d06)
	out[14] = invDet * (m31 * d01 - m30 * d03 - m32 * d00)
	out[15] = invDet * (m20 * d03 - m21 * d01 + m22 * d00)
	return out
}

mat4.frustum = (left, right, bottom, top, zNear, zFar, out = mat4()) => {
    const rl = 1 / (right - left),
          tb = 1 / (top - bottom),
          nf = 1 / (zNear - zFar)
    out[0] = 2*zNear*rl;        out[1] = 0;                 out[2] = 0;                 out[3] = 0
    out[4] = 0;                 out[5] = 2*zNear*tb;        out[6] = 0;                 out[7] = 0
    out[8] = (right+left)*rl;   out[9] = (top+bottom)*tb;   out[10] = (zFar+zNear)*nf;  out[11] = -1
    out[12] = 0;                out[13] = 0;                out[14] = 2*zFar*zNear*nf;  out[15] = 0
    return out
}

mat4.perspective = (fovy, aspectRatio, zNear, zFar, out = mat4()) => {
    const f = 1 / Math.tan(fovy / 2),
          nf = 1 / (zNear - zFar)
    out[0] = f/aspectRatio; out[1] = 0;     out[2] = 0;                 out[3] = 0
    out[4] = 0;             out[5] = f;     out[6] = 0;                 out[7] = 0
    out[8] = 0;             out[9] = 0;     out[10] = (zFar+zNear)*nf;  out[11] = -1
    out[12] = 0;            out[13] = 0;    out[14] = 2*zFar*zNear*nf;     out[15] = 0
    return out
}

mat4.ortho = (left, right, bottom, top, zNear, zFar, out = mat4()) => {
    const lr = 1 / (left - right),
          bt = 1 / (bottom - top),
          nf = 1 / (zNear - zFar)
    out[0] = -2*lr;             out[1] = 0;                 out[2] = 0;                 out[3] = 0
    out[4] = 0;                 out[5] = -2*bt;             out[6] = 0;                 out[7] = 0
    out[8] = 0;                 out[9] = 0;                 out[10] = 2*nf;             out[11] = 0
    out[12] = (left+right)*lr;  out[13] = (top+bottom)*bt;  out[14] = (zFar+zNear)*nf;  out[15] = 1
    return out
}

mat4.translate = (mat, v, out = mat4()) => {
    const x = v[0], y = v[1], z = v[2]
    out[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12]
    out[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13]
    out[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14]
    out[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15]
    if(out !== mat){
        out[0] = mat[0]; out[1] = mat[1]; out[2] = mat[2]; out[3] = mat[3]
        out[4] = mat[4]; out[5] = mat[5]; out[6] = mat[6]; out[7] = mat[7]
        out[8] = mat[8]; out[9] = mat[9]; out[10] = mat[10]; out[11] = mat[11]
    }
    return out
}

mat4.fromQuat = (q, out = mat4()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3],
          x2 = 2 * x,   y2 = 2 * y,     z2 = 2 * z,
          xx = x * x2,  yy = y * y2,    zz = z * z2,
          yx = x * y2,  zx = x * z2,    zy = y * z2,
          wx = w * x2,  wy = w * y2,    wz = w * z2
    out[0] = 1 - yy - zz;     out[1] = yx + wz;       out[2] = zx - wy;           out[3] = 0
    out[4] = yx - wz;         out[5] = 1 - xx - zz;   out[6] = zy + wx;           out[7] = 0
    out[8] = zx + wy;         out[9] = zy - wx;       out[10] = 1 - xx - yy;      out[11] = 0
    out[12] = 0;              out[13] = 0;            out[14] = 0;                out[15] = 1
    return out
}

mat4.multiply = (mat1, mat2, out = mat4()) => {
    const m00 = mat1[0], m01 = mat1[1], m02 = mat1[2], m03 = mat1[3],
          m10 = mat1[4], m11 = mat1[5], m12 = mat1[6], m13 = mat1[7],
          m20 = mat1[8], m21 = mat1[9], m22 = mat1[10], m23 = mat1[11],
          m30 = mat1[12], m31 = mat1[13], m32 = mat1[14], m33 = mat1[15]
    let by0 = mat2[0], by1 = mat2[1], by2 = mat2[2], by3 = mat2[3]
    out[0] = by0*m00 + by1*m10 + by2*m20 + by3*m30
    out[1] = by0*m01 + by1*m11 + by2*m21 + by3*m31
    out[2] = by0*m02 + by1*m12 + by2*m22 + by3*m32
    out[3] = by0*m03 + by1*m13 + by2*m23 + by3*m33
    by0 = mat2[4], by1 = mat2[5], by2 = mat2[6], by3 = mat2[7]
    out[4] = by0*m00 + by1*m10 + by2*m20 + by3*m30
    out[5] = by0*m01 + by1*m11 + by2*m21 + by3*m31
    out[6] = by0*m02 + by1*m12 + by2*m22 + by3*m32
    out[7] = by0*m03 + by1*m13 + by2*m23 + by3*m33
    by0 = mat2[8], by1 = mat2[9], by2 = mat2[10], by3 = mat2[11]
    out[8] = by0*m00 + by1*m10 + by2*m20 + by3*m30
    out[9] = by0*m01 + by1*m11 + by2*m21 + by3*m31
    out[10] = by0*m02 + by1*m12 + by2*m22 + by3*m32
    out[11] = by0*m03 + by1*m13 + by2*m23 + by3*m33
    by0 = mat2[12], by1 = mat2[13], by2 = mat2[14], by3 = mat2[15]
    out[12] = by0*m00 + by1*m10 + by2*m20 + by3*m30
    out[13] = by0*m01 + by1*m11 + by2*m21 + by3*m31
    out[14] = by0*m02 + by1*m12 + by2*m22 + by3*m32
    out[15] = by0*m03 + by1*m13 + by2*m23 + by3*m33
    return out
}

mat4.scale = (mat, sv, out = mat4()) => {
    const x = sv[0], y = sv[1], z = sv[2]
    out[0] = mat[0] * x; out[1] = mat[1] * x; out[2] = mat[2] * x; out[3] = mat[3] * x
    out[4] = mat[4] * y; out[5] = mat[5] * y; out[6] = mat[6] * y; out[7] = mat[7] * y
    out[8] = mat[8] * z; out[9] = mat[9] * z; out[10] = mat[10] * z; out[11] = mat[11] * z
    out[12] = mat[12];   out[13] = mat[13];   out[14] = mat[14];    out[15] = mat[15]
    return out
}

mat4.rotate = (mat, rad, rv, out = mat4()) => {
    const x = rv[0], y = rv[1], z = rv[2],
          sin = Math.sin(rad), cos = Math.cos(rad), icos = 1 - cos,
          m00 = mat[0], m01 = mat[1], m02 = mat[2], m03 = mat[3],
          m10 = mat[4], m11 = mat[5], m12 = mat[6], m13 = mat[7],
          m20 = mat[8], m21 = mat[9], m22 = mat[10], m23 = mat[11],
          r00 = x * x * icos + cos, r01 = y * x * icos + z * sin, r02 = z * x * icos - y * sin,
          r10 = x * y * icos - z * sin, r11 = y * y * icos + cos, r12 = z * y * icos + x * sin,
          r20 = x * z * icos + y * sin, r21 = y * z * icos - x * sin, r22 = z * z * icos + cos
    out[0] = m00 * r00 + m10 * r01 + m20 * r02
    out[1] = m01 * r00 + m11 * r01 + m21 * r02
    out[2] = m02 * r00 + m12 * r01 + m22 * r02
    out[3] = m03 * r00 + m13 * r01 + m23 * r02
    out[4] = m00 * r10 + m10 * r11 + m20 * r12
    out[5] = m01 * r10 + m11 * r11 + m21 * r12
    out[6] = m02 * r10 + m12 * r11 + m22 * r12
    out[7] = m03 * r10 + m13 * r11 + m23 * r12
    out[8] = m00 * r20 + m10 * r21 + m20 * r22
    out[9] = m01 * r20 + m11 * r21 + m21 * r22
    out[10] = m02 * r20 + m12 * r21 + m22 * r22
    out[11] = m03 * r20 + m13 * r21 + m23 * r22
    out[12] = mat[12]; out[13] = mat[13]; out[14] = mat[14]; out[15] = mat[15]
    return out
}
//TODO order? (xyz)
mat4.fromEuler = (angles, out = mat4()) => {
    const x = angles[0], y = angles[1], z = angles[2],
          sinx = Math.sin(-x), cosx = Math.cos(-x),
          siny = Math.sin(-y), cosy = Math.cos(-y),
          sinz = Math.sin(-z), cosz = Math.cos(-z)
    out[0] = cosy * cosz; out[1] = -cosy * sinz; out[2] = siny; out[3] = 0
    out[4] = cosx * sinz + cosz * sinx * siny; out[5] = cosx * cosz - sinx * siny * sinz; out[6] = -cosy * sinx; out[7] = 0
    out[8] = sinx * sinz - cosx * cosz * siny; out[9] = cosz * sinx + cosx * siny * sinz; out[10] = cosx * cosy; out[11] = 0
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1
    return out
}

mat4.determinant = mat => {
    const m00 = mat[0],   m01 = mat[1],   m02 = mat[2],   m03 = mat[3],
          m10 = mat[4],   m11 = mat[5],   m12 = mat[6],   m13 = mat[7],
          m20 = mat[8],   m21 = mat[9],   m22 = mat[10],  m23 = mat[11],
          m30 = mat[12],  m31 = mat[13],  m32 = mat[14],  m33 = mat[15],
          d00 = m00 * m11 - m01 * m10,
          d01 = m00 * m12 - m02 * m10,
          d02 = m00 * m13 - m03 * m10,
          d03 = m01 * m12 - m02 * m11,
          d04 = m01 * m13 - m03 * m11,
          d05 = m02 * m13 - m03 * m12,
          d06 = m20 * m31 - m21 * m30,
          d07 = m20 * m32 - m22 * m30,
          d08 = m20 * m33 - m23 * m30,
          d09 = m21 * m32 - m22 * m31,
          d10 = m21 * m33 - m23 * m31,
          d11 = m22 * m33 - m23 * m32

  return d00 * d11 - d01 * d10 + d02 * d09 + d03 * d08 - d04 * d07 + d05 * d06;
}

mat4.decompose = (t, r, scale, m) => {
    const sx = 1 / Math.sqrt(m[0]*m[0] + m[1]*m[1] + m[2]*m[2]) * (mat4.determinant(m) < 0 ? -1 : 1)
    const sy = 1 / Math.sqrt(m[4]*m[4] + m[5]*m[5] + m[6]*m[6])
    const sz = 1 / Math.sqrt(m[8]*m[8] + m[9]*m[9] + m[10]*m[10])
    t[0] = m[12]
    t[1] = m[13]
    t[2] = m[14]
    scale[0] = 1/sx
    scale[1] = 1/sy
    scale[2] = 1/sz
    let r00 = sx * m[0], r01 = sx * m[1], r02 = sx * m[2],
        r10 = sy * m[4], r11 = sy * m[5], r12 = sy * m[6],
        r20 = sz * m[8], r21 = sz * m[9], r22 = sz * m[10]
    
    const trace = r00 + r11 + r22
    let s = 0
    if(trace > 0){
        s = 0.5 / Math.sqrt(trace + 1.0)
        r[3] = 0.25 / s
        r[0] = (r21 - r12) * s
        r[1] = (r02 - r20) * s
        r[2] = (r10 - r01) * s
    }else if(r00 > r11 && r00 > r22){
        s = 2.0 / Math.sqrt(1.0 + r00 - r11 - r22)
        r[3] = (r21 - r12) / s
        r[0] = 0.25 * s
        r[1] = (r01 + r10) / s
        r[2] = (r02 + r20) / s
    }else if(r11 > r22){
        s = 2.0 * Math.sqrt(1.0 + r11 - r00 - r22)
        r[3] = (r02 - r20) / s
        r[0] = (r01 + r10) / s
        r[1] = 0.25 * s
        r[2] = (r12 + r21) / s
    }else{
        s = 2.0 * Math.sqrt(1.0 + r22 - r00 - r11)
        r[3] = (r10 - r01) / s
        r[0] = (r02 + r20) / s
        r[1] = (r12 + r21) / s
        r[2] = 0.25 * s
    }
}

mat4.fromRotationTranslationScale = (q, v, s, out = mat4()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3],
          x2 = x + x, y2 = y + y, z2 = z + z,
          xx = x * x2,xy = x * y2,xz = x * z2,
          yy = y * y2,yz = y * z2,zz = z * z2,
          wx = w * x2,wy = w * y2,wz = w * z2,
          sx = s[0],sy = s[1],sz = s[2]

  out[0] = (1 - (yy + zz)) * sx
  out[1] = (xy + wz) * sx
  out[2] = (xz - wy) * sx
  out[3] = 0
  out[4] = (xy - wz) * sy
  out[5] = (1 - (xx + zz)) * sy
  out[6] = (yz + wx) * sy
  out[7] = 0
  out[8] = (xz + wy) * sz
  out[9] = (yz - wx) * sz
  out[10] = (1 - (xx + yy)) * sz
  out[11] = 0
  out[12] = v[0]
  out[13] = v[1]
  out[14] = v[2]
  out[15] = 1
  return out
}

mat4.lookAt = (eye, target, up, out = mat4()) => {
    const eyeX = eye[0], eyeY = eye[1], eyeZ = eye[2],
          targetX = target[0], targetY = target[1], targetZ = target[2],
          upX = up[0], upY = up[1], upZ = up[2]
    let z0 = eyeX - targetX,
        z1 = eyeY - targetY,
        z2 = eyeZ - targetZ,
        length = Math.sqrt(z0*z0 + z1*z1 + z2*z2),
        invLength = length ? 1 / length : 0
    z0 *= invLength
    z1 *= invLength
    z2 *= invLength
    let x0 = upY * z2 - upZ * z1,
        x1 = upZ * z0 - upX * z2,
        x2 = upX * z1 - upY * z0
    length = Math.sqrt(x0*x0 + x1*x1 + x2*x2)
    invLength = length ? 1 / length : 0
    x0 *= invLength
    x1 *= invLength
    x2 *= invLength
    let y0 = z1 * x2 - z2 * x1,
        y1 = z2 * x0 - z0 * x2,
        y2 = z0 * x1 - z1 * x0
    length = Math.sqrt(y0*y0 + y1*y1 + y2*y2)
    invLength = length ? 1 / length : 0
    y0 *= invLength
    y1 *= invLength
    y2 *= invLength

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0
    out[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ)
    out[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ)
    out[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ)
    out[15] = 1
    
    return out
}

mat4.targetTo = (eye, target, up, out = mat4()) => {
    const eyeX = eye[0], eyeY = eye[1], eyeZ = eye[2],
          upX = up[0], upY = up[1], upZ = up[2]
    let z0 = eyeX - target[0],
        z1 = eyeY - target[1],
        z2 = eyeZ - target[2],
        length = Math.sqrt(z0*z0 + z1*z1 + z2*z2),
        invLength = length ? 1 / length : 1
    z0 *= invLength
    z1 *= invLength
    z2 *= invLength
    let x0 = upY * z2 - upZ * z1,
        x1 = upZ * z0 - upX * z2,
        x2 = upX * z1 - upY * z0
    length = Math.sqrt(x0*x0 + x1*x1 + x2*x2)
    invLength = length ? 1 / length : 1
    x0 *= invLength
    x1 *= invLength
    x2 *= invLength
    
    out[0] = x0; out[1] = x1; out[2] = x2; out[3] = 0
    out[4] = z1 * x2 - z2 * x1
    out[5] = z2 * x0 - z0 * x2
    out[6] = z0 * x1 - z1 * x0
    out[7] = 0; out[8] = z0; out[9] = z1; out[10] = z2
    out[11] = 0; out[12] = eyeX; out[13] = eyeY; out[14] = eyeZ; out[15] = 1
    return out
}

mat4.fromDualquat = (dq, out = mat4()) => {
    const rx = dq[0], ry = dq[1], rz = dq[2], rw = dq[3],
          tx = dq[4], ty = dq[5], tz = dq[6], tw = dq[7],
          xx = (2.0 * rx * rx), yy = (2.0 * ry * ry), zz = (2.0 * rz * rz),
          xy = (2.0 * rx * ry), xz = (2.0 * rx * rz), xw = (2.0 * rx * rw),
          yz = (2.0 * ry * rz), yw = (2.0 * ry * rw), zw = (2.0 * rz * rw)
    out[0] = 1.0 - yy - zz
    out[1] = xy + zw
    out[2] = xz - yw
    out[3] = 0
    out[4] = xy - zw
    out[5] = 1.0 - xx - zz
    out[6] = yz + xw
    out[7] = 0
    out[8] = xz + yw
    out[9] = yz - xw
    out[10] = 1.0 - xx - yy
    out[11] = 0
    out[12] = 2.0 * (-tw * rx + tx * rw - ty * rz + tz * ry)
    out[13] = 2.0 * (-tw * ry + tx * rz + ty * rw - tz * rx)
    out[14] = 2.0 * (-tw * rz - tx * ry + ty * rx + tz * rw)
    out[15] = 1
    return out
}

export {mat4}