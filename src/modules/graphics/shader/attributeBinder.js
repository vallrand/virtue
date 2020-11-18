import {GLSL_TYPE_MAP, GLSL_TYPE_SIZE, GL_TYPE_SIZE, ATTRIBUTE_LOCATIONS} from '../glutil'

const bindAttribute = function(gl, type, normalized, stride, offset){
    gl.enableVertexAttribArray(this.location)
    gl.vertexAttribPointer(this.location, this.size, type || gl.FLOAT, normalized || false, stride, offset)
}

const bindAttributeLocation = (gl, program, location, name) => gl.bindAttribLocation(program, location, name)

const preBindAttributes = (gl, program, attributeLocations = ATTRIBUTE_LOCATIONS) => Object.keys(attributeLocations)
.forEach(attribName => bindAttributeLocation(gl, program, attributeLocations[attribName], attribName))

const extractShaderAttributes = (gl, program, attributeLocations = ATTRIBUTE_LOCATIONS) => {
    const attributes = Object.create(null)
    let idx = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    while(idx--){
        const data = gl.getActiveAttrib(program, idx),
              type = GLSL_TYPE_MAP[data.type],
              attribute = {
                type,
                size: GLSL_TYPE_SIZE[type],
                location: gl.getAttribLocation(program, data.name)
              }
        attribute.bind = bindAttribute.bind(attribute, gl)
        attributes[data.name] = attribute
        if(attributeLocations[data.name] !== undefined)
            bindAttributeLocation(gl, program, attributeLocations[data.name], data.name)
    }
    return attributes
}

export {extractShaderAttributes, preBindAttributes}