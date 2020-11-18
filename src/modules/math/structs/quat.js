import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'
import {HALF_DEG_RAD} from '../constants'
import {vec4} from './vec4'
import {vec3} from './vec3'

const quat = _ => vec4(0,0,0,1)

quat.copy = vec4.copy
quat.normalize = vec4.normalize

quat.multiply = (q1, q2, out = quat()) => {
    const x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3],
          x2 = q2[0], y2 = q2[1], z2 = q2[2], w2 = q2[3]
    out[0] = x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2
    out[1] = y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2
    out[2] = z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2
    out[3] = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return out
}

quat.rotateX = (q, rad, out = quat()) => {
    rad*=0.5
    const x = q[0], y = q[1], z = q[2], w = q[3],
          sin = Math.sin(rad), cos = Math.cos(rad)
    out[0] = x * cos + w * sin
    out[1] = y * cos + z * sin
    out[2] = z * cos - y * sin
    out[3] = w * cos - x * sin
    return out
}

quat.rotateY = (q, rad, out = quat()) => {
    rad*=0.5
    const x = q[0], y = q[1], z = q[2], w = q[3],
          sin = Math.sin(rad), cos = Math.cos(rad)
    out[0] = x * cos - z * sin
    out[1] = y * cos + w * sin
    out[2] = z * cos + x * sin
    out[3] = w * cos - y * sin
    return out
}

quat.rotateZ = (q, rad, out = quat()) => {
    rad*=0.5
    const x = q[0], y = q[1], z = q[2], w = q[3],
          sin = Math.sin(rad), cos = Math.cos(rad)
    out[0] = x * cos + y * sin
    out[1] = y * cos - x * sin
    out[2] = z * cos + w * sin
    out[3] = w * cos - z * sin
    return out
}

//TODO: is this used ? Degrees ?
/*quat.fromEuler = (out = quat(), x, y, z) => {
    x *= HALF_DEG_RAD
    y *= HALF_DEG_RAD
    z *= HALF_DEG_RAD
    const sx = Math.sin(x),
          cx = Math.cos(x),
          sy = Math.sin(y),
          cy = Math.cos(y),
          sz = Math.sin(x),
          cz = Math.cos(z)
    out[0] = sx * cy * cz - cx * sy * sz
    out[1] = cx * sy * cz + sx * cy * sz
    out[2] = cx * cy * sz - sx * sy * cz
    out[3] = cx * cy * cz + sx * sy * sz
    return out
}*/

quat.setAxisAngle = (axis, rad, out = quat()) => { //TODO rename fromAxisAngle?
    rad*=0.5
    const sin = Math.sin(rad)
    out[0] = sin * axis[0]
    out[1] = sin * axis[1]
    out[2] = sin * axis[2]
    out[3] = Math.cos(rad)
    return out
}

quat.fromEulerOrdered = (x, y, z, order = 'XYZ', out = quat()) => {
    const cx = Math.cos( x / 2 ), cy = Math.cos( y / 2 ), cz = Math.cos( z / 2 ),
          sx = Math.sin( x / 2 ), sy = Math.sin( y / 2 ), sz = Math.sin( z / 2 )
    if(order === 'XYZ'){
        out[0] = sx * cy * cz + cx * sy * sz
        out[1] = cx * sy * cz - sx * cy * sz
        out[2] = cx * cy * sz + sx * sy * cz
        out[3] = cx * cy * cz - sx * sy * sz
    }else if(order === 'YXZ'){
        out[0] = sx * cy * cz + cx * sy * sz
        out[1] = cx * sy * cz - sx * cy * sz
        out[2] = cx * cy * sz - sx * sy * cz
        out[3] = cx * cy * cz + sx * sy * sz
    }else if(order === 'ZXY'){
        out[0] = sx * cy * cz - cx * sy * sz
        out[1] = cx * sy * cz + sx * cy * sz
        out[2] = cx * cy * sz + sx * sy * cz
        out[3] = cx * cy * cz - sx * sy * sz
    }else if(order === 'ZYX'){
        out[0] = sx * cy * cz - cx * sy * sz
        out[1] = cx * sy * cz + sx * cy * sz
        out[2] = cx * cy * sz - sx * sy * cz
        out[3] = cx * cy * cz + sx * sy * sz
    }else if(order === 'YZX'){
        out[0] = sx * cy * cz + cx * sy * sz
        out[1] = cx * sy * cz + sx * cy * sz
        out[2] = cx * cy * sz - sx * sy * cz
        out[3] = cx * cy * cz - sx * sy * sz
    }else if(order === 'XZY'){
        out[0] = sx * cy * cz - cx * sy * sz
        out[1] = cx * sy * cz - sx * cy * sz
        out[2] = cx * cy * sz + sx * sy * cz
        out[3] = cx * cy * cz + sx * sy * sz
    }
    return out
}

quat.slerp = (q1, q2, f, out = quat()) => {
    let x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3],
        x2 = q2[0], y2 = q2[1], z2 = q2[2], w2 = q2[3],
        coshTheta = x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2,
        ratio1, ratio2, hTheta, sinhTheta
    if (coshTheta < 0.0) {
        coshTheta = -coshTheta
        x2 = - x2; y2 = - y2; z2 = - z2; w2 = - w2
    }
    if(1.0 - coshTheta > 0.000001){
        hTheta  = Math.acos(coshTheta)
        sinhTheta  = Math.sin(hTheta)
        ratio1 = Math.sin((1.0 - f) * hTheta) / sinhTheta
        ratio2 = Math.sin(f * hTheta) / sinhTheta
    }else{
        ratio1 = 1.0 - f
        ratio2 = f
    }
    out[0] = ratio1 * x1 + ratio2 * x2
    out[1] = ratio1 * y1 + ratio2 * y2
    out[2] = ratio1 * z1 + ratio2 * z2
    out[3] = ratio1 * w1 + ratio2 * w2
    return out
}

quat.fromMat3 = (mat, out = quat()) => {
    const fTrace = mat[0] + mat[4] + mat[8]
    let fRoot
    if(fTrace > 0.0){
        fRoot = Math.sqrt(fTrace + 1.0)
        out[3] = 0.5 * fRoot
        fRoot = 0.5 / fRoot
        out[0] = (mat[5] - mat[7]) * fRoot
        out[1] = (mat[6] - mat[2]) * fRoot
        out[2] = (mat[1] - mat[3]) * fRoot
    }else{
        let i = mat[4] > mat[0] ? 1 : 0
        if(mat[8] > mat[i*3 + i]) i = 2
        const j = (i+1)%3,
              k = (i+2)%3
        fRoot = Math.sqrt(mat[i*3 + i] - mat[j*3 + j] - mat[k*3 + k] + 1.0)
        out[i] = 0.5 * fRoot
        fRoot = 0.5 / fRoot
        out[3] = (mat[j * 3 + k] - mat[k * 3 + j]) * fRoot
        out[j] = (mat[j * 3 + i] + mat[i * 3 + j]) * fRoot
        out[k] = (mat[k * 3 + i] + mat[i * 3 + k]) * fRoot
    }
    return out
}

quat.fromMat4 = (mat, out = quat()) => {
    const trace = mat[0] + mat[5] + mat[10]
    let S = 0
    if(trace > 0){
        S = Math.sqrt(trace + 1.0) * 2
        out[3] = 0.25 * S
        out[0] = (mat[6] - mat[9]) / S
        out[1] = (mat[8] - mat[2]) / S
        out[2] = (mat[1] - mat[4]) / S
    }else if((mat[0] > mat[5]) & (mat[0] > mat[10])){
        S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2
        out[3] = (mat[6] - mat[9]) / S
        out[0] = 0.25 * S
        out[1] = (mat[1] + mat[4]) / S
        out[2] = (mat[8] + mat[2]) / S
    }else if(mat[5] > mat[10]){
        S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2
        out[3] = (mat[8] - mat[2]) / S
        out[0] = (mat[1] + mat[4]) / S
        out[1] = 0.25 * S
        out[2] = (mat[6] + mat[9]) / S
    }else{
        S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2
        out[3] = (mat[1] - mat[4]) / S
        out[0] = (mat[8] + mat[2]) / S
        out[1] = (mat[6] + mat[9]) / S
        out[2] = 0.25 * S
    }
    return out
}

quat.rotationTo = (from, to, out = quat()) => {
    const dot = vec3.dot(from, to)
    if(dot < -0.999999){
        let temp = vec3.cross(vec3(), vec3.AXIS_X, from)
        if(vec3.distance(temp) < 0.000001)
            vec3.cross(vec3.AXIS_Y, from, temp)
        vec3.normalize(temp, temp)
        quat.setAxisAngle(temp, Math.PI, out)
    }else if(dot > 0.999999){
        out[0] = 0
        out[1] = 0
        out[2] = 0
        out[3] = 1
    }else{
        let temp = vec3.cross(from, to, vec3())
        out[0] = temp[0]
        out[1] = temp[1]
        out[2] = temp[2]
        out[3] = 1 + dot
        quat.normalize(out, out)
    }
    return out
}

quat.invert = (a, out = quat()) => {
    let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1 / dot : 0
    
    out[0] = -a0 * invDot
    out[1] = -a1 * invDot
    out[2] = -a2 * invDot
    out[3] = a0 * invDot
    
    return out
}

export {quat}