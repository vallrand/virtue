import {factory, Stream} from '../../util'
import {vec3, vec4, mat4} from '../../math'
import {Observable,Node} from '../instance'

factory.declare('omnilight', Observable)
factory.declare('omnilight', Node)

factory.declare('omnilight', (target, options) => {
    const position = vec3.copy(options.position || [0, 0, 0]),
          color = vec3.copy(options.color || [1, 1, 1]),
          camera = factory.build('cube:camera')
    let radius = radius = options.radius || 100,
        castShadow = options.castShadow !== undefined ? !!options.castShadow : false
    let dirtyFlag = true
    target.mutation.attach(_ => dirtyFlag = true, null, false)
    
    return {
        get camera(){
            if(!dirtyFlag) return camera
            dirtyFlag = false
            
            camera.position = target.parent ? vec4.transform(position, target.parent.modelMatrix) : position
            //TODO set zNear and zFar
            return camera
        },
        get castShadow(){ return castShadow },
        get position(){ return position },
        get color(){ return color },
        get radius(){ return radius },
        set castShadow(value){
            castShadow = !!value
        },
        set color(value){
            vec3.copy(value, color)
        },
        set position(value){
            vec3.copy(value, position)
            dirtyFlag = true
        },
        set radius(value){
            radius = value
            dirtyFlag = true
        },
        queryShadowcasters: face => options.queryShadowcasters().filter(instance => target.camera.faces[face].frustumCulling(instance)),
        get boundingSphereRadius(){ return radius }
    }
})