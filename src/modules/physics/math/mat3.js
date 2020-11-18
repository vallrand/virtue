import {mat3} from '../../math'

mat3.ZERO = mat3(0)
mat3.temp = mat3()

mat3.scale = (m, v, out = mat3()) => {
    const sx = v[0], sy = v[1], sz = v[2]
    out[0] = sx * m[0]
    out[1] = sy * m[1]
    out[2] = sz * m[2]
    
    out[3] = sx * m[3]
    out[4] = sy * m[4]
    out[5] = sz * m[5]
    
    out[6] = sx * m[6]
    out[7] = sy * m[7]
    out[8] = sz * m[8]
    return out
}

export {mat3}