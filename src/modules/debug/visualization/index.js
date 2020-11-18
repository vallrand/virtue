export * from './renderer'
export * from './physics'
export * from './lights'
export * from './decals'
export * from './raycast'
export * from './navigation'

import {tie, factory} from '../../util'
import {shaders} from '../../graphics/vglsl'
import {ATTRIBUTE_LOCATIONS} from '../../graphics/glutil'

factory.declare('application', target => {
    const ctx = target.ctx,
          gl = ctx.gl,
          scene = target.scene
    
    const shader = ctx.compileShader(shaders.fullscreen)
    const quadVBO = factory.build('vbo', { ctx }).staticUpload(new Float32Array([0,0,1,0,1,1,0,1]), new Uint16Array([0,1,2,0,2,3]))
    shader.uao.sampler = 0
    
    let debugTexture = null
    
    ctx.pipeline.pass((ctx, scene, next, frame) => {
        if(!debugTexture) return next()
        
        ctx.saveState()
        
        shader.use()
        quadVBO.bind()
        
        ctx.bindArrayAttribute(ATTRIBUTE_LOCATIONS['uv'], 2, gl.FLOAT, false, 2*4, 0)
        debugTexture.bind(0)
        
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
        
        ctx.restoreState()
        next()
    })
    
    window.setDebugTexture = value => debugTexture = value
    //setDebugTexture(app.ctx.renderShadowMap(app.scene.lights[0], { shared: false, blur: false }))
})