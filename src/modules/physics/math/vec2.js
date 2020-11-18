import {vec2} from '../../math'

vec2.set = (x, y, out = vec2()) => {
    out[0] = x
    out[1] = y
    return out
}

export {vec2}