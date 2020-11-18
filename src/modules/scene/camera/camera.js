import {factory, tie, Stream} from '../../util'
import {mat3, mat4, vec3, vec4, quat, frustum} from '../../math'

factory.declare('camera', (target, options) => {
    options = tie({
        fovy: 45.0,
        zNear: 0.1,
        zFar: 1024.0
    }, options)
    const projectionMatrix = mat4.identity(),
          viewMatrix = mat4.identity(),
          rotation = mat4(),
          eyePosition = vec3(),
          eyeRotation = quat(),
          viewFrustum = frustum(),
          mutation = Stream()
    
	return {
        projectionMatrix, viewMatrix, 
        eyePosition, eyeRotation,
        mutation,
        get rotation(){ return eyeRotation },
        set rotation(value){ quat.copy(value, eyeRotation) },
        get position(){ return eyePosition },
        set position(value){ vec3.copy(value, eyePosition) },
        get viewProjectionMatrix(){ return mat4.multiply(projectionMatrix, viewMatrix) },
        resize: screen => (mat4.perspective(options.fovy * Math.PI/180, screen.width/screen.height, options.zNear, options.zFar, projectionMatrix), 
                           frustum.fromMat(projectionMatrix, viewFrustum), 
                           mutation.onSuccess({projectionMatrix})),
        recalculateView: _ => {
            mat4.fromQuat(eyeRotation, rotation)
            mat4.translate(rotation, vec3.scale(eyePosition, -1), viewMatrix)
            
            //:::ALTERNATIVE:::
            //mat4.fromQuat(eyeRotation, viewMatrix)
            //viewMatrix[12] = -eyePosition[0]
            //viewMatrix[13] = -eyePosition[1]
            //viewMatrix[14] = -eyePosition[2]
            //mat4.invert(viewMatrix, viewMatrix)
            
            //const normalMat = mat4.invert(viewMatrix)
            mutation.onSuccess({viewMatrix})
        },
        rotate: (yaw, pitch) => {
            quat.rotateY(eyeRotation, yaw, eyeRotation)
            quat.multiply(quat.setAxisAngle(vec3.LEFT, pitch), eyeRotation, eyeRotation)
            
            //:::ALTERNATIVE:::
            //quat.rotateX(eyeRotation, -pitch, eyeRotation)
            //quat.multiply(quat.setAxisAngle(vec3.UP, -yaw), eyeRotation, eyeRotation)
            
            quat.normalize(eyeRotation, eyeRotation)
        },
        get rotationMatrix(){ return rotation },
        get forward(){ return vec3(-rotation[2], -rotation[6], -rotation[10]) },
        get up(){ return vec3(-rotation[1], -rotation[5], -rotation[9]) },
        get left(){ return vec3(-rotation[0], -rotation[4], -rotation[8]) },
        frustumCulling: instance => frustum.containsSphere(viewFrustum, vec4.transform(vec3.translationFromMat4(instance.modelMatrix), viewMatrix), instance.boundingSphereRadius)
            //:::ALTERNATIVE:::
            //frustum.fromMat(mat4.multiply(projectionMatrix, viewMatrix), viewFrustum)
            //return frustum.containsSphere(viewFrustum, vec3.translationFromMat4(instance.modelMatrix), instance.boundingSphereRadius)
	}
})