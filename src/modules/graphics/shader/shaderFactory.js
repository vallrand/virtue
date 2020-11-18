import {factory} from '../../util'
import {vglsl} from '../vglsl'
import {GLSL_TYPE_SIZE, GL_GLSL_MAP, GLSL_TYPE_MAP} from '../glutil'

factory.declare('gl_context', target => {
	const gl = target.gl,
          maxVertShaderPrecision = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT).precision === 0 ? vglsl.PRECISION.MEDIUM : vglsl.PRECISION.HIGH,
          maxFragShaderPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision === 0 ? vglsl.PRECISION.MEDIUM : vglsl.PRECISION.HIGH,
          maxVertUniformSize = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)/4,
          maxFragUniformSize = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)/4,
          shaders = []
    Object.keys(GL_GLSL_MAP).forEach(glType => GLSL_TYPE_MAP[gl[glType]] = GL_GLSL_MAP[glType])
   
	return {
        compileShader: src => {
            if(src.vert.precision === vglsl.PRECISION.HIGH && maxVertShaderPrecision === vglsl.PRECISION.MEDIUM) src.vert.setPrecision(vglsl.PRECISION.MEDIUM)
            if(src.frag.precision === vglsl.PRECISION.HIGH && maxFragShaderPrecision === vglsl.PRECISION.MEDIUM) src.frag.setPrecision(vglsl.PRECISION.MEDIUM)
            const shader = factory.build('shader', {
                vert: src.vert.build(),
                frag: src.frag.build(),
                attributeLocations: src.attributeLocations,
                ctx: target
            })
            return shader
        }
	}
})