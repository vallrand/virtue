import {factory, snapshot} from '../../util'
import {vec2, vec4} from '../../math'
import {GL_BLEND_MODES} from './blendModes'

factory.declare('gl_context', target => {
    const gl = target.gl,
          bindings = Object.create(null),
          state = {
              depthTest: false,
              viewport: vec2(),
              colorMask: vec4(true, true, true, true),
              clearColor: vec4(0,0,0,0),
              depthMask: true,
              culling: 0,
              blendMode: 0
          }
    
    let temporaryArrayBuffer = new ArrayBuffer(0),
        saveState = new Function('state', 'snapshot', Object.keys(state).map(param => `snapshot.${param} = state.${param}${state[param].slice ? '.slice()' : ''}`).join(';')+';return snapshot;').bind(target, state),
        restoreState = new Function('target', 'snapshot', Object.keys(state).map(param => `target.${param} = snapshot.${param}`).join(';')).bind(target, target),
        snapshotStack = []
    
    return {
        get state(){ return snapshot(state) },
        bindings,
        onBind: (location, element) => bindings[location] === element ? false : (bindings[location] = element, true),
        allocateUint16: size => {
            const byteSize = size * Uint16Array.BYTES_PER_ELEMENT
            if(temporaryArrayBuffer.byteLength < byteSize)
                temporaryArrayBuffer = new ArrayBuffer(byteSize)
            return new Uint16Array(temporaryArrayBuffer, 0, size)
        },
        set depthTest(value){
            if(state.depthTest !== value)
                state.depthTest = (value ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST), value)
        },
        set viewport(value){
            if(value[0] !== state.viewport[0] || value[1] !== state.viewport[1]){
                vec2.copy(value, state.viewport)
                gl.viewport(0, 0, value[0], value[1])
            }
        },
        set colorMask(value){
            if(value[0] !== state.colorMask[0] || value[1] !== state.colorMask[1] || value[2] !== state.colorMask[2] || value[3] !== state.colorMask[3]){
                vec4.copy(value, state.colorMask)
                gl.colorMask(value[0], value[1], value[2], value[3])
            }
        },
        set clearColor(value){
            if(value[0] !== state.clearColor[0] || value[1] !== state.clearColor[1] || value[2] !== state.clearColor[2] || value[3] !== state.clearColor[3]){
                vec4.copy(value, state.clearColor)
                gl.clearColor(value[0], value[1], value[2], value[3])
            }
        },
        set depthMask(value){
            if(state.depthMask !== value)
                state.depthMask = (gl.depthMask(value), value)
        },
        set culling(value){
            if(state.culling !== value){
                state.culling = value
                if(!value) gl.disable(gl.CULL_FACE)
                else{
                    gl.enable(gl.CULL_FACE)
                    if(value === 'back') gl.cullFace(gl.BACK)
                    if(value === 'front') gl.cullFace(gl.FRONT)
                }
            }
        },
        set blendMode(value){
            if(state.blendMode !== value){
                state.blendMode = value
                if(!value) gl.disable(gl.BLEND)
                else{
                    gl.enable(gl.BLEND)
                    GL_BLEND_MODES[value](gl)
                }
            }
        },
        saveState: _ => (snapshotStack.push(saveState(Object.create(null))), target),
        restoreState: _ => (restoreState(snapshotStack.pop()), target)
    }
})