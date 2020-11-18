import {factory, tie} from '../../util'
import {GL_TYPE_SIZE, GLSL_TYPE_SIZE, ATTRIBUTE_LOCATIONS, ATTRIB_GL_TYPE} from '../glutil'

factory.declare('vao', (target, {ctx}) => {
    const gl = ctx.gl,
          vaoExtension = ctx.extensions.vertex_array_object, //TODO test with AND without extension, option to disable
          maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          vao = vaoExtension ? vaoExtension.createVertexArrayOES() : null,
          bindings = []
    let vboPointer = null
    
    return vaoExtension ? {
        clear: _ => vaoExtension.deleteVertexArrayOES(vao),
        bind: _ => ctx.onBind('vao', target) && vaoExtension.bindVertexArrayOES(vao),
        unbind: _ => {
            ctx.onBind('vbo', null)
            ctx.onBind('vao', null)
            vaoExtension.bindVertexArrayOES(null)
        },
        setup: (vbo, dataFormat, attributeLocations = ATTRIBUTE_LOCATIONS) => {
            let offset = 0,
                stride = dataFormat.reduce((size, attr) => size + attr.size * attr.byteSize, 0)
            target.bind()
            target.vboPointer = vbo
            ctx.onBind('vbo', null)
            vbo.bind()
            dataFormat.forEach(attr => {
                gl.enableVertexAttribArray(attributeLocations[attr.type])
                gl.vertexAttribPointer(attributeLocations[attr.type], attr.size, gl[ATTRIB_GL_TYPE[attr.byteSize]], false, stride, offset)
                offset += attr.size * attr.byteSize
            })
            target.unbind()
            return target
        }
    } : {
        clear: _ => bindings.length = 0,
        bind: _ => {
            if(!ctx.onBind('vao', target))
                return true
            let idx = bindings.length
            while(idx--)
                bindings[idx](gl)
        },
        unbind: _ => {
            ctx.onBind('vao', null)
        },
        setup: (vbo, dataFormat, attributeLocations = ATTRIBUTE_LOCATIONS) => {
            let offset = 0,
                stride = dataFormat.reduce((size, attr) => size + attr.size * attr.byteSize, 0)
            target.vboPointer = vbo
            bindings.unshift(vbo.bind.bind(vbo))
            dataFormat.forEach(attr => {
                bindings.unshift(ctx.bindArrayAttribute.bind(null, attributeLocations[attr.type], attr.size, gl[ATTRIB_GL_TYPE[attr.byteSize]], false, stride, offset))
                offset += attr.size * attr.byteSize
            })
            return target
        }
    }
})



