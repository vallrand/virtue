const GLSL_TYPE_SIZE = {
    'float':    1,
    'vec2':     2,
    'vec3':     3,
    'vec4':     4,
    
    'int':      1,
    'ivec2':    2,
    'ivec3':    3,
    'ivec4':    4,
    
    'mat2':     4,
    'mat3':     9,
    'mat4':     16,
    
    'sampler2D': 1,
    'samplerCube': 1
}

const GL_TYPE_SIZE = {
    'BYTE': Int8Array.BYTES_PER_ELEMENT,
    'SHORT': Int16Array.BYTES_PER_ELEMENT,
    'UNSIGNED_BYTE': Uint8Array.BYTES_PER_ELEMENT,
    'UNSIGNED_SHORT': Uint16Array.BYTES_PER_ELEMENT,
    'FLOAT': Float32Array.BYTES_PER_ELEMENT
}

const GL_GLSL_MAP = {
    'FLOAT':        'float',
    'FLOAT_VEC2':   'vec2',
    'FLOAT_VEC3':   'vec3',
    'FLOAT_VEC4':   'vec4',
    
    'INT':          'int',
    'INT_VEC2':     'ivec2',
    'INT_VEC3':     'ivec3',
    'INT_VEC4':     'ivec4',

    'FLOAT_MAT2':   'mat2',
    'FLOAT_MAT3':   'mat3',
    'FLOAT_MAT4':   'mat4',

    'SAMPLER_2D':   'sampler2D',
    'SAMPLER_CUBE': 'samplerCube'
}

const GLSL_TYPE_MAP = {}

const DEFAULT_GLSL_VALUE = {
    'float': size => size === 1 ? 0.0 : new Float32Array(size),
    'vec2': size => new Float32Array(2 * size),
    'vec3': size => new Float32Array(3 * size),
    'vec4': size => new Float32Array(4 * size),
    
    'int': size => size === 1 ? 0 : new Int32Array(size),
    'ivec2': size => new Int32Array(2 * size),
    'ivec3': size => new Int32Array(3 * size),
    'ivec4': size => new Int32Array(4 * size),
    
    'mat2': () => new Float32Array(4),
    'mat3': () => new Float32Array(9),
    'mat4': () => new Float32Array(16),
    
    'sampler2D': size => size === 1 ? 0 : new Int32Array(size),
    'samplerCube': size => size === 1 ? 0 : new Int32Array(size)
}

const GLSL_SETTERS = {
    'float':    'uniform1f(loc,v)',
    'vec2':     'uniform2f(loc,v[0],v[1])',
    'vec3':     'uniform3f(loc,v[0],v[1],v[2])',
    'vec4':     'uniform4f(loc,v[0],v[1],v[2],v[3])',
    
    'int':      'uniform1i(loc,v)',
    'ivec2':    'uniform2i(loc,v[0],v[1])',
    'ivec3':    'uniform3i(loc,v[0],v[1],v[2])',
    'ivec4':    'uniform4i(loc,v[0],v[1],v[2],v[3])',
    
    'mat2':     'uniformMatrix2fv(loc,false,v)',
    'mat3':     'uniformMatrix3fv(loc,false,v)',
    'mat4':     'uniformMatrix4fv(loc,false,v)',
    
    'sampler2D':'uniform1i(loc,v)',
    'samplerCube':'uniform1i(loc,v)'
}

const GLSL_ARRAY_SETTERS = {
    'float':    'uniform1fv(loc,v)',
    'vec2':     'uniform2fv(loc,v)',
    'vec3':     'uniform3fv(loc,v)',
    'vec4':     'uniform4fv(loc,v)',
    
    'int':      'uniform1iv(loc,v)',
    'ivec2':    'uniform2iv(loc,v)',
    'ivec3':    'uniform3iv(loc,v)',
    'ivec4':    'uniform4iv(loc,v)',
    
    'mat2':     'uniformMatrix2fv(loc,false,v)',
    'mat3':     'uniformMatrix3fv(loc,false,v)',
    'mat4':     'uniformMatrix4fv(loc,false,v)',
    
    'sampler2D':'uniform1iv(loc,v)',
    'samplerCube':'uniform1iv(loc,v)'
}

const MAX_INDEX_ARRAY_LENGTH = Math.pow(2, 16) - 1

const ATTRIBUTE_LOCATIONS = {
    'position': 0,
    'normal': 1,
    'uv': 2,
    'joint': 4,
    'weight': 5,
    'tangent': 6,
    'color': 7,
    'lm_uv': 8
}

const ATTRIB_GL_TYPE = [null,'UNSIGNED_BYTE','UNSIGNED_SHORT',0,'FLOAT']

const MAX_BONES_PER_MESH = 64
    
export {GLSL_TYPE_SIZE, GL_GLSL_MAP, GLSL_TYPE_MAP, DEFAULT_GLSL_VALUE, GLSL_SETTERS, GLSL_ARRAY_SETTERS, 
    GL_TYPE_SIZE, MAX_INDEX_ARRAY_LENGTH, ATTRIBUTE_LOCATIONS, ATTRIB_GL_TYPE, MAX_BONES_PER_MESH}