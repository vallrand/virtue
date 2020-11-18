import {factory, Signal, tie} from '../../util'
import {shaders} from '../vglsl'
import {ATTRIBUTE_LOCATIONS} from '../glutil'
import {vec3, mat3, mat4} from '../../math'

const PostEffectPass = (ctx, scene) => {
    console.warn('post - effects not implemented')
    return (ctx, scene, next, frame) => {
        next()
    }
}

export {PostEffectPass}