import { factory, Signal } from '../util'
import {vec3, vec4, mat4} from '../math'

function updateListenerCoordinates(audioCtx, position, forward, up){
    if(audioCtx.listener.positionX && audioCtx.listener.forwardX){
        audioCtx.listener.positionX.setValueAtTime(position[0], audioCtx.currentTime)
        audioCtx.listener.positionY.setValueAtTime(position[1], audioCtx.currentTime)
        audioCtx.listener.positionZ.setValueAtTime(position[2], audioCtx.currentTime)
        
        audioCtx.listener.forwardX.setValueAtTime(forward[0], audioCtx.currentTime)
        audioCtx.listener.forwardY.setValueAtTime(forward[1], audioCtx.currentTime)
        audioCtx.listener.forwardZ.setValueAtTime(forward[2], audioCtx.currentTime)
        audioCtx.listener.upX.setValueAtTime(up[0], audioCtx.currentTime)
        audioCtx.listener.upY.setValueAtTime(up[1], audioCtx.currentTime)
        audioCtx.listener.upZ.setValueAtTime(up[2], audioCtx.currentTime)
    }else{
        audioCtx.listener.setPosition(position[0], position[1], position[2])
        
        audioCtx.listener.setOrientation(forward[0], forward[1], forward[2], up[0], up[1], up[2])
    }
}

function updateEmitterCoordinates(audioCtx, pannerNode, position, orientation){
    if(pannerNode.positionX && pannerNode.orientationX){
        pannerNode.positionX.setValueAtTime(position[0], audioCtx.currentTime)
        pannerNode.positionY.setValueAtTime(position[1], audioCtx.currentTime)
        pannerNode.positionZ.setValueAtTime(position[2], audioCtx.currentTime)
        
        pannerNode.orientationX.setValueAtTime(orientation[0], audioCtx.currentTime)
        pannerNode.orientationY.setValueAtTime(orientation[1], audioCtx.currentTime)
        pannerNode.orientationZ.setValueAtTime(orientation[2], audioCtx.currentTime)
    }else{
        pannerNode.setPosition(position[0], position[1], position[2])
        pannerNode.setOrientation(orientation[0], orientation[1], orientation[2])
    }
}

factory.declare('audio_context', (target, options) => {
    const audioCtx = target.ctx
    const scene = options.scene
    
    const listener = {
        position: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        forward: vec3(0, 0, -1)
    }
    
    scene.camera.mutation.pipe(mutations => {
        if(!mutations.viewMatrix) return
        const { position, rotationMatrix } = scene.camera
        
        vec3.copy(position, listener.position)
        
        listener.forward[0] = -rotationMatrix[2]
        listener.forward[1] = -rotationMatrix[6]
        listener.forward[2] = -rotationMatrix[10]
        
        listener.up[0] = -rotationMatrix[1]
        listener.up[1] = -rotationMatrix[5]
        listener.up[2] = -rotationMatrix[9]
        
        updateListenerCoordinates(audioCtx, listener.position, listener.forward, listener.up)
    })

    target.components.push(context => {
        context.position = vec3(0, 0, 0)
        context.orientation = vec3(1, 0, 0)
        
        context.pannerNode = context.audio.createPanner()
        Object.assign(context.pannerNode, {
            panningModel: 'equalpower',
            distanceModel: 'exponential',
            refDistance: 1,
            maxDistance: 10000,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0
        })
        
        context.pannerNode.connect(context.nodes[0])
        context.nodes.unshift(context.pannerNode)
        
        return function update(instance){
            vec3.translationFromMat4(instance.modelMatrix, context.position)
            updateEmitterCoordinates(context.audio, context.pannerNode, context.position, context.orientation)
        }
    })
})