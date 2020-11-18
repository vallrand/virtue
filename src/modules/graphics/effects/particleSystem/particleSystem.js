import {factory, tie} from '../../../util'
import {generateParticleTexture} from './util'

factory.declare('gl_context', (target, options) => {
    const gl = target.gl,
          groups = []
        
    return {
        get particleSystems(){ return groups },
        registerParticleSystem: ({ attributeFormat, bufferFormat, limit, shaderSrc }) => {
            const group = factory.build('particle_system', { ctx: target, format: bufferFormat, limit })
            const attributeLocations = attributeFormat.reduce((attributes, attribute, location) => 
                                                              (attributes[attribute.type] = location, attributes), Object.create(null))
            shaderSrc.attributeLocations = attributeLocations
            const shader = target.compileShader(shaderSrc)
            const vao = factory.build('vao', {ctx: target}).setup(group, attributeFormat, attributeLocations)
            
            shader.uao.rampSampler = 0
            shader.uao.textureAtlas = 1
            
            groups.push({ group, shader, vao })
            return groups[groups.length - 1]
        }
    }
})