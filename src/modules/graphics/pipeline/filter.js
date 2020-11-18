import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {ATTRIBUTE_LOCATIONS} from '../glutil'
import {vec2, vec3, vec4, mat3, mat4} from '../../math'

const FullscreenQuad = ctx => {
    const gl = ctx.gl,
          quadVBO = factory.build('vbo', {ctx}).staticUpload(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), new Uint16Array([0, 1, 2, 0, 2, 3]))
    
    return {
        render: _ => {
            quadVBO.bind()
            ctx.bindArrayAttribute(ATTRIBUTE_LOCATIONS['uv'], 2, gl.FLOAT, false, 2*4, 0)
            ctx.drawElements(6, 0)
        }
    }
}

factory.declare('gl_context', (target, options) => {
    const gl = target.gl, ctx = target,
          taskManager = options.manager,
          quad = FullscreenQuad(target),
          filters = {
              blur: target.compileShader(vglsl.merge(shaders.fullscreen, shaders.box_blur)),
              dilate: target.compileShader(vglsl.merge(shaders.fullscreen, shaders.dilate)),
              none: target.compileShader(shaders.fullscreen)
          }
    
    return {
        filters,
        prepareFilter: (filter, input, output) => {
            output = output || factory.build('texture', {ctx}).copy(input)
            const framebuffer = ctx.pollFramebuffer(output.width, output.height).attachTexture(output)
            
            return target.applyFilter.bind(null, filter, framebuffer, input)
        },
        applyFilter: (filter, framebuffer, input) => {
            ctx.saveState()
            ctx.depthTest = ctx.depthMask = ctx.blendMode = false
            
            filter.uao.pixelSize = vec2.copy([1.0/framebuffer.width, 1.0/framebuffer.height], filter.uao.pixelSize)
            filter.uao.sampler = 0
            input.bind(0)

            framebuffer.bind(true)
            filter.use()
            
            gl.clear(gl.COLOR_BUFFER_BIT)
            quad.render()
            
            framebuffer.unbind()
            ctx.restoreState()
            return framebuffer.attachedTextures[0]
        }
    }
})