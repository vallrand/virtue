import {logger} from '../../debug/logger'
import {factory} from '../../util'
import {extractShaderUniforms} from './uniformAccessObject'
import {extractShaderAttributes, preBindAttributes} from './attributeBinder'

const compileShader = (gl, type, src) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : (logger.info('webgl', gl.getShaderInfoLog(shader)), null)
}

const compileShaderProgram = (gl, vert, frag, attributeLocations) => {
    const program = gl.createProgram(),
          vertShader = compileShader(gl, gl.VERTEX_SHADER, vert),
          fragShader = compileShader(gl, gl.FRAGMENT_SHADER, frag)
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    
    preBindAttributes(gl, program, attributeLocations)
    
    gl.linkProgram(program)
    gl.deleteShader(vertShader)
    gl.deleteShader(fragShader)
    return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : (logger.info('webgl', gl.getProgramInfoLog(program)), gl.deleteProgram(program), null)
}

factory.declare('shader', (target, {ctx, vert, frag, attributeLocations}) => {
    const gl = ctx.gl,
          program = compileShaderProgram(gl, vert, frag, attributeLocations),
          uao = extractShaderUniforms(gl, program),
          attributes = extractShaderAttributes(gl, program, attributeLocations) //TODO why we are doing it twice? preBind should be enough?
		
	return {
        attributes, uao, program,
        use: _ => {
            ctx.onBind('shader', target) && gl.useProgram(program)
            uao.update()
        },
        clear: _ => gl.deleteProgram(program)
	}
})

export {compileShader, compileShaderProgram}