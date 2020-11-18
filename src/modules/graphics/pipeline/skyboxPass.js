import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {ATTRIBUTE_LOCATIONS} from '../glutil'
import {vec3, mat3, mat4} from '../../math'

export const SkyboxPass = (ctx, scene) => {
    const gl = ctx.gl,
          shader = ctx.compileShader(shaders.fullscreen_cube),
          cubeVBO = factory.build('vbo', { ctx }).staticUpload(
              new Float32Array([
             1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1,
             1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1,
             1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1,
            -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1,
            -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1,
             1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1
              ]),
              new Uint16Array([
                  0, 1, 2,   0, 2, 3,
                  4, 5, 6,   4, 6, 7,
                  8, 9,10,   8,10,11,
                  12,13,14,  12,14,15,
                  16,17,18,  16,18,19,
                  20,21,22,  20,22,23
              ])
          )
    shader.uao.sampler = 0
    
    let skyboxTexture = null
    
    scene.camera.mutation.pipe(mutations => {
        if(mutations.projectionMatrix)
            shader.uao.projectionMatrix = mat4.copy(mutations.projectionMatrix, shader.uao.projectionMatrix)
        //TODO optimize
        if(mutations.viewMatrix)
            shader.uao.modelViewMatrix = mat4.multiply(mutations.viewMatrix, mat4.translate(mat4.identity(), scene.camera.position), shader.uao.modelViewMatrix)
    }, false)
    
//    app.ctx.renderShadowMap(app.scene.lights[2], { shared: false, blur: false }).pipe(texture => app.ctx.setSkyboxTexture(texture))
    
    return (ctx, scene, next, frame) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) //TODO have a skybox related pass!!
        
        if(!skyboxTexture) return next()
        
        ctx.saveState()
        
        ctx.depthTest = false
        
        shader.use()
        cubeVBO.bind()
        
        ctx.bindArrayAttribute(ATTRIBUTE_LOCATIONS['position'], 3, gl.FLOAT, false, 3*4, 0)
        skyboxTexture.bind(0)
        
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
        
        ctx.restoreState()
        next()
    }
}