import {factory, Stream} from '../../util'
import {vec3, quat, mat4} from '../../math'

const Instance = (target, options) => {
    const modelMatrix = mat4.identity(),
          position = vec3.copy(options.position || vec3.ZERO),
          rotation = quat.copy(options.rotation || quat()),
          scale = vec3.copy(options.scale || vec3.ONE)
    let dirtyFlag = true
    target.mutation = target.mutation.pipe(event => {
        dirtyFlag = true
        return event
    }, false)
    
    return {
        delegate: options.delegate,
        get position(){ return position },
        get scale(){ return scale },
        get rotation(){ return rotation },
        set position(value){
            vec3.copy(value, position)
            target.propagate(0, value, target)
        },
        set scale(value){
            vec3.copy(value, scale)
            target.propagate(0, value, target)
        },
        set rotation(value){
            quat.copy(value, rotation)
            target.propagate(0, value, target)
        },
        recalculateModelMatrix: _ => {
            mat4.fromRotationTranslationScale(rotation, position, scale, modelMatrix)
            target.parent && mat4.multiply(target.parent.modelMatrix, modelMatrix, modelMatrix)
            dirtyFlag = false
        },
        get modelMatrix(){
            if(dirtyFlag) target.recalculateModelMatrix()
            return modelMatrix
        }
    }
}

export {Instance}