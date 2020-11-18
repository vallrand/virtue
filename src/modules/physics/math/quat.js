import {quat} from '../../math'

quat.set = (x, y, z, w, out = quat()) => {
    out[0] = x
    out[1] = y
    out[2] = z
    out[3] = w
    return out
}

quat.conjugate = (q, out = quat()) => {
    out[0] = -q[0]
    out[1] = -q[1]
    out[2] = -q[2]
    out[3] = q[3]
    return out
}

quat.invert = (q, out = quat()) => { //TODO: For normalized, conjugate is enough
    const x = q[0], y = q[1], z = q[2], w = q[3],
          lengthSquared = x*x + y*y + z*z + w*w,
          invLengthSquared = lengthSquared ? 1 / lengthSquared : 0
    out[0] = invLengthSquared * -x
    out[1] = invLengthSquared * -y
    out[2] = invLengthSquared * -z
    out[3] = invLengthSquared * w
    return out
}

quat.normalizeApproximation = (q, out = quat()) => {
    const x = q[0], y = q[1], z = q[2], w = q[3],
          f = (3.0 - (x*x + y*y + z*z + w*w)) / 2.0
    out[0] = x * f
    out[1] = y * f
    out[2] = z * f
    out[3] = w * f
    return out
}

quat.temp = quat()

export {quat}