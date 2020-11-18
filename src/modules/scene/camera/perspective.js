import {factory, tie, Stream} from '../../util'
import {mat3, mat4, vec3, vec4, quat, frustum} from '../../math'

factory.declare('perspective:camera', (target, options) => {
    options = tie({
        fovy: 45.0,
        aspectRatio: 1,
        zNear: 0.1,
        zFar: 1024.0
    }, options)
    const up = vec3.copy(options.up || vec3.AXIS_Y),
          forward = vec3.copy(options.forward || vec3.AXIS_Z),
          position = vec3.copy(options.position || vec3.ZERO),
          projectionMatrix = mat4.identity(),
          viewMatrix = mat4.identity(),
          viewProjectionMatrix = mat4.identity(),
          viewFrustum = frustum()
    let dirtyFlag = [true, true]

	return {
        get position(){ return position },
        set position(value){
            vec3.copy(value, position)
            dirtyFlag[1] = true
        },
        get up(){ return up },
        set up(value){
            vec3.copy(value, up)
            dirtyFlag[1] = true
        },
        get forward(){ return forward },
        set forward(value){
            vec3.copy(value, forward)
            dirtyFlag[1] = true
        },
        get zNear(){ return options.zNear },
        set zNear(value){
            if(target.zNear === value) return
            options.zNear = value
            dirtyFlag[0] = true
        },
        get zFar(){ return options.zFar },
        set zFar(value){
            if(target.zFar === value) return
            options.zFar = value
            dirtyFlag[0] = true
        },
        get fovy(){ return options.fovy },
        set fovy(value){
            if(target.fovy === value) return
            options.fovy = value
            dirtyFlag[0] = true
        },
        get aspectRatio(){ return options.aspectRatio },
        set aspectRatio(value){
            if(target.aspectRatio === value) return
            options.aspectRatio = value
            dirtyFlag[0] = true
        },
        get viewFrustum(){
            if(!dirtyFlag[0]) return viewFrustum
            dirtyFlag[0] = false
            mat4.perspective(options.fovy, options.aspectRatio, options.zNear, options.zFar, projectionMatrix)
            frustum.fromMat(projectionMatrix, viewFrustum)
            return viewFrustum
        },
        get projectionMatrix(){
            if(!dirtyFlag[0]) return projectionMatrix
            dirtyFlag[0] = false
            mat4.perspective(options.fovy, options.aspectRatio, options.zNear, options.zFar, projectionMatrix)
            frustum.fromMat(projectionMatrix, viewFrustum)
            return projectionMatrix
        },
        get viewMatrix(){
            if(!dirtyFlag[1]) return viewMatrix
            dirtyFlag[1] = false
            mat4.lookAt(position, vec3.add(position, forward), up, viewMatrix)
            return viewMatrix
        },
        get viewProjectionMatrix(){
            mat4.multiply(target.projectionMatrix, target.viewMatrix, viewProjectionMatrix)
            return viewProjectionMatrix
        },
        frustumCulling: instance => frustum.containsSphere(target.viewFrustum, vec4.transform(vec3.translationFromMat4(instance.modelMatrix), target.viewMatrix), instance.boundingSphereRadius)
	}
})