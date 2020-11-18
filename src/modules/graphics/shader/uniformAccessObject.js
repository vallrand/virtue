import {GLSL_TYPE_MAP, DEFAULT_GLSL_VALUE, GLSL_SETTERS, GLSL_ARRAY_SETTERS} from '../glutil'
import {Autowire} from './autowire'

const uniformGetter = function(){
    return this.value
}
const uniformArraySetter = function(value){
    this.value.set(value)
    if(!this.dirtyFlag)
        this.dirtyFlag = (this.dirty.push(this), true)
}
const uniformSetter = function(value){
    if(this.value === value) return false
    this.value = value
    if(!this.dirtyFlag)
        this.dirtyFlag = (this.dirty.push(this), true)
}
const updateUniforms = function(){
    let idx = this.length,
        uniform = null
    while(idx--){
        uniform = this[idx]
        uniform.update(uniform.value)
        uniform.dirtyFlag = false
    }
    this.length = 0
}

const extractShaderUniforms = (gl, program) => {
    const uniformAccessObject = Object.create(null)
    const dirty = []
    let idx = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    while(idx--){
        const data = gl.getActiveUniform(program, idx),
              name = data.name.replace(/\[0\]$/,''),
              type = GLSL_TYPE_MAP[data.type],
              uniform = {
                  type, dirty,
                  dirtyFlag: true,
                  location: gl.getUniformLocation(program, name),
                  size: data.size,
                  value: DEFAULT_GLSL_VALUE[type](data.size)
              }
        uniform.update = (new Function('gl','loc','v', 'gl.'+(data.size===1 ? GLSL_SETTERS[type] : GLSL_ARRAY_SETTERS[type]))).bind(uniform, gl, uniform.location)
        name.replace(/\]/g,'').split(/\.|\[/).reduce((acc, property, idx, list) => {            
            if(idx+1 >= list.length)
                Object.defineProperty(acc, property, {
                    get: uniformGetter.bind(uniform),
                    set: isNaN(uniform.value) ? uniformArraySetter.bind(uniform) : uniformSetter.bind(uniform),
                    enumerable: true
                })
            else
                acc[property] = acc[property] || (isNaN(list[idx+1]) ? Object.create(null) : [])
            return acc[property]                              
        }, uniformAccessObject)
        dirty.push(uniform)
    } 
    uniformAccessObject.update = updateUniforms.bind(dirty)
    uniformAccessObject.autowire = Autowire(uniformAccessObject)
    return uniformAccessObject
}

export {extractShaderUniforms}