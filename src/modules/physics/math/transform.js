import {vec3} from './vec3'
import {quat} from './quat'

const Transform = {
    pointToLocalFrame: (point, position, rotation, out = vec3()) => {
        vec3.subtract(point, position, out)
        quat.conjugate(rotation, quat.temp)
        vec3.transformQuat(out, quat.temp, out)
        return out
    },
    pointToWorldFrame: (point, position, rotation, out = vec3()) => {
        vec3.transformQuat(point, rotation, out)
        vec3.add(out, position, out)
        return out
    },
    vectorToLocalFrame: (vector, position, rotation, out = vec3()) => {
        quat.conjugate(rotation, quat.temp)
        vec3.transformQuat(vector, quat.temp, out)
        return out
    },
    vectorToWorldFrame: (vector, position, rotation, out = vec3()) => {
        vec3.transformQuat(vector, rotation, out)
        return out
    }
}

export {Transform}