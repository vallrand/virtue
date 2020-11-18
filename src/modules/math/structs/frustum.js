const frustum = _ => new Float32Array(6 * 4)

frustum.fromMat = (mat, out = frustum()) => {
    const m00 = mat[0], m01 = mat[1], m02 = mat[2], m03 = mat[3],
          m10 = mat[4], m11 = mat[5], m12 = mat[6], m13 = mat[7],
          m20 = mat[8], m21 = mat[9], m22 = mat[10], m23 = mat[11],
          m30 = mat[12], m31 = mat[13], m32 = mat[14], m33 = mat[15]
    //right
    let x = m03 - m00, y = m13 - m10, z = m23 - m20, w = m33 - m30,
        il = 1.0 / Math.sqrt(x*x + y*y + z*z) || 0
    out[0] = il * x; out[1] = il * y; out[2] = il * z; out[3] = il * w
    //left
    x = m03 + m00, y = m13 + m10, z = m23 + m20, w = m33 + m30,
        il = 1.0 / Math.sqrt(x*x + y*y + z*z) || 0
    out[4] = il * x; out[5] = il * y; out[6] = il * z; out[7] = il * w
    //bottom
    x = m03 + m01, y = m13 + m11, z = m23 + m21, w = m33 + m31,
        il = 1.0 / Math.sqrt(x*x + y*y + z*z) || 0
    out[8] = il * x; out[9] = il * y; out[10] = il * z; out[11] = il * w
    //top
    x = m03 - m01, y = m13 - m11, z = m23 - m21, w = m33 - m31,
        il = 1.0 / Math.sqrt(x*x + y*y + z*z) || 0
    out[12] = il * x; out[13] = il * y; out[14] = il * z; out[15] = il * w
    //far
    x = m03 - m02, y = m13 - m12, z = m23 - m22, w = m33 - m32,
        il = 1.0 / Math.sqrt(x*x + y*y + z*z) || 0
    out[16] = il * x; out[17] = il * y; out[18] = il * z; out[19] = il * w
    //near
    x = m03 + m02, y = m13 + m12, z = m23 + m22, w = m33 + m32,
        il = 1.0 / Math.sqrt(x*x + y*y + z*z) || 0
    out[20] = il * x; out[21] = il * y; out[22] = il * z; out[23] = il * w
    return out
}

frustum.containsSphere = (fr, v, rad = 0) => {
    const x = v[0], y = v[1], z = v[2]
    rad = -rad
    return !(
        (fr[0] * x + fr[1] * y + fr[2] * z + fr[3]) < rad ||
        (fr[4] * x + fr[5] * y + fr[6] * z + fr[7]) < rad ||
        (fr[8] * x + fr[9] * y + fr[10] * z + fr[11]) < rad ||
        (fr[12] * x + fr[13] * y + fr[14] * z + fr[15]) < rad ||
        (fr[16] * x + fr[17] * y + fr[18] * z + fr[19]) < rad ||
        (fr[20] * x + fr[21] * y + fr[22] * z + fr[23]) < rad || 
        false
    )
}

frustum.containsBox = (fr, box) => {
    let x1,x2,y1,y2,z1,z2,
        x,y,z,w,
        planes = 0
    while(planes < 24){
        x = fr[planes+0], y = fr[planes+1], z = fr[planes+2], w = fr[planes+3]
        x > 0 ? (x1 = box.minX, x2 = box.maxX) : (x1 = box.maxX, x2 = box.minX)
        y > 0 ? (y1 = box.minY, y2 = box.maxY) : (y1 = box.maxY, y2 = box.minY)
        z > 0 ? (z1 = box.minZ, z2 = box.maxZ) : (z1 = box.maxZ, z2 = box.minZ)
        if((x * x1 + y * y1 + z * z1 + w < 0) && (x * x2 + y * y2 + z * z2 + w < 0))
            return false
        planes+=4
    }
    return true
}

export {frustum}