import {factory} from '../../util'

factory.declare('gl_context', target => {
    const gl = target.gl,
          extensions = {
              //instanced_arrays: gl.getExtension('ANGLE_instanced_arrays'),
              //blend_minmax: gl.getExtension('EXT_blend_minmax'),
              //disjoint_timer_query: gl.getExtension('EXT_disjoint_timer_query'),
              frag_depth: gl.getExtension('EXT_frag_depth'),
              shader_texture_lod: gl.getExtension('EXT_shader_texture_lod'),
              //sRGB: gl.getExtension('EXT_sRGB'),
              //texture_filter_anisotropic: gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'),
              //element_index_uint: gl.getExtension('OES_element_index_uint'),
              standadrd_derivatives: gl.getExtension('OES_standard_derivatives'),
              texture_float: gl.getExtension('OES_texture_float'),
              texture_float_linear: gl.getExtension("OES_texture_float_linear"),
              texture_half_float: gl.getExtension('OES_texture_half_float'),
              texture_half_float_linear: gl.getExtension('OES_texture_half_float_linear'),
              vertex_array_object: gl.getExtension('OES_vertex_array_object') || gl.getExtension('MOZ_OES_vertex_array_object') || gl.getExtension('WEBKIT_OES_vertex_array_object'),
              depth_texture: gl.getExtension('WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture'),
              //draw_buffers: gl.getExtension('WEBGL_draw_buffers'),
              //lose_context: gl.getExtension('WEBGL_lose_context') || gl.getExtension('WEBKIT_WEBGL_lose_context') 
          }
    if(extensions.texture_half_float)
        gl.HALF_FLOAT = extensions.texture_half_float.HALF_FLOAT_OES
    if(extensions.depth_texture)
        gl.UNSIGNED_INT_24_8 = extensions.depth_texture.UNSIGNED_INT_24_8_WEBGL
    
    return {
        extensions
    }
})