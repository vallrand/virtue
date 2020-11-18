import {factory, Stream} from '../../util'
import {vec3, vec4, mat4} from '../../math'
import {Observable} from '../instance'

factory.declare('hemisphere', Observable)

factory.declare('hemisphere', (target, options) => {
    const up = vec3.copy(options.up || [0, 1, 0]),
          skyColor = vec3.copy(options.skyColor || [1, 1, 1]),
          groundColor = vec3.copy(options.groundColor || [0, 0, 0])
    //TODO add boundingSphereRadius and position
    return {
        get up(){ return up },
        get skyColor(){ return skyColor },
        get groundColor(){ return groundColor },
        set up(value){
            vec3.copy(value, up)
        },
        set skyColor(value){
            vec3.copy(value, skyColor)
        },
        set groundColor(value){
            vec3.copy(value, groundColor)
        }
    }
})