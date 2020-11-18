import {factory, Stream} from '../../util'
import {vec3, vec4, mat4} from '../../math'
import {Observable,Node} from '../instance'

factory.declare('spotlight', Observable)
factory.declare('spotlight', Node)

factory.declare('spotlight', (target, options) => {
    const position = vec3.copy(options.position || [0, 0, 0]),
          destination = vec3.copy(options.destination || [0, -1, 0]),
          color = vec3.copy(options.color || [1, 1, 1]),
          camera = factory.build('perspective:camera')
    let radius = radius = options.radius || 100,
        outerAngle = options.angle || 0.25 * Math.PI,
        innerAngle = 0.5 * outerAngle,
        castShadow = options.castShadow !== undefined ? !!options.castShadow : false
    let dirtyFlag = true
    target.mutation.attach(_ => dirtyFlag = true, null, false)
    
    return {
        get camera(){
            if(!dirtyFlag) return camera
            dirtyFlag = false
            
            //TODO optimise
            const worldPosition = target.parent ? vec4.transform(position, target.parent.modelMatrix) : position
            const worldDestination = target.parent ? vec4.transform(destination, target.parent.modelMatrix) : destination
            const direction = vec3.normalize(vec3.subtract(worldDestination, worldPosition))
                       
            camera.position = worldPosition
            camera.forward = direction
            camera.zNear = radius * 0.001
            camera.zFar = 2 * radius
            camera.fovy = outerAngle * 2.0
            camera.aspectRatio = 1
            camera.up = Math.abs(direction[1]) > 0.9 ? vec3.AXIS_Z : vec3.AXIS_Y
            return camera
        },
        get castShadow(){ return castShadow },
        get position(){ return position },
        get destination(){ return destination },
        get direction(){ return target.camera.forward },
        get color(){ return color },
        get radius(){ return radius },
        get angle(){ return outerAngle },
        get cosOuterAngle(){ return Math.cos(outerAngle) },
        get cosInnerAngle(){ return Math.cos(innerAngle) },
        set castShadow(value){
            castShadow = !!value
        },
        set color(value){
            vec3.copy(value, color)
        },
        set angle(value){
            outerAngle = value
            innerAngle = 0.5 * value
            dirtyFlag = true
        },
        set position(value){
            vec3.copy(value, position)
            dirtyFlag = true
        },
        set destination(value){
            vec3.copy(value, destination)
            dirtyFlag = true
        },
        set radius(value){
            radius = value
            dirtyFlag = true
        },
        queryShadowcasters: _ => options.queryShadowcasters().filter(instance => target.camera.frustumCulling(instance)),
        get boundingSphereRadius(){ return radius }
    }
})