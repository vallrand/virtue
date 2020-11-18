import {factory, Signal, tie} from '../../util'
import {shaders} from '../vglsl'
import {ATTRIBUTE_LOCATIONS} from '../glutil'
import {WRAP_MODE, FILTERING_MODE} from '../texture'
import {mat4} from '../../math'

factory.declare('gl_context', (target, options) => {
    const gl = target.gl, ctx = target,
          taskManager = options.manager,
          shader = ctx.compileShader(shaders.vsm_depth),
          shadowMapScale = 1
    let framebuffer = null,
        sharedShadowMap = null, //TODO rename to renderTexture
        sharedShadowCubeMap = null
    
    return {//TODO add shadowmapper prefix?
        renderShadowMap: (light, { shared = true, blur = true } = {}) => { //TODO async
            const camera = light.camera
            if(camera.cube) return target.renderShadowCubeMap(light, { shared })
            if(!framebuffer) framebuffer = ctx.pollFramebuffer(shadowMapScale*1024, shadowMapScale*1024).attachTexture(null).attachDepth(true)
            const shadowmap = (!shared && light.shadowmap) || (sharedShadowMap || (sharedShadowMap = factory.build('texture', { ctx })
            .uploadTexture(null, {
                width: framebuffer.width, 
                height: framebuffer.height, 
                format: gl.RGBA, 
                byteSize: (ctx.maxTexturePrecision === 32 && gl.FLOAT) || (ctx.maxTexturePrecision === 16 && gl.HALF_FLOAT) || gl.UNSIGNED_BYTE})
            .setTextureParameters({
                wrapMode: WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP),
                filteringMode: FILTERING_MODE.set(FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR, 0)})
            .unbind()))
            
            taskManager.schedule(_ => {
                ctx.saveState()
            
                ctx.blendMode = false
                ctx.depthTest = true
                ctx.culling = 'back'
                shader.use()

                shader.uao.viewMatrix = mat4.copy(camera.viewMatrix, shader.uao.viewMatrix)
                shader.uao.projectionMatrix = mat4.copy(camera.projectionMatrix, shader.uao.projectionMatrix)
                shader.uao.radius = light.radius

                framebuffer.bind(true).attachTexture(shadowmap)
                ctx.colorMask = [true, true, false, false]
                ctx.clearColor = [0.0, 0.0, 0.0, 0.0]
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                light.queryShadowcasters().forEach(instance => {
                    const meshData = instance.delegate.data
                    ctx.enableVAO(meshData)
                    shader.uao.modelMatrix = mat4.copy(instance.modelMatrix, shader.uao.modelMatrix)
                    shader.uao.update()
                    ctx.drawElements(meshData.totalSize, meshData.offset)
                })

                framebuffer.unbind()
                ctx.restoreState()
            })
            
            return Signal(done => taskManager.schedule(function(){
                if(!blur) return done.call(target, shadowmap)
                
                shadowmap.blur = shadowmap.blur || ctx.prepareFilter(ctx.filters.blur, shadowmap)
                return done.call(target, shadowmap.blur())
            }))
        },
        renderShadowCubeMap: (light, { shared = true } = {}) => {
            const camera = light.camera
            if(!framebuffer) framebuffer = ctx.pollFramebuffer(shadowMapScale*1024, shadowMapScale*1024).attachTexture(null).attachDepth(true)
            const shadowmap = (!shared && light.shadowmap) || (sharedShadowCubeMap || (sharedShadowCubeMap = factory.build('texture', { ctx, cube: camera.cube })
            .uploadTexture(null, {
                width: framebuffer.width, 
                height: framebuffer.height, 
                format: gl.RGBA, 
                byteSize: (ctx.maxTexturePrecision === 32 && gl.FLOAT) || (ctx.maxTexturePrecision === 16 && gl.HALF_FLOAT) || gl.UNSIGNED_BYTE})
            .setTextureParameters({
                wrapMode: WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP),
                filteringMode: FILTERING_MODE.set(FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR, 0)})
            .unbind()))
            
            camera.faces.forEach((camera, face) => taskManager.schedule(_ => {
                ctx.saveState()
            
                ctx.blendMode = false
                ctx.depthTest = true
                ctx.culling = 'back'
                shader.use()
                
                shader.uao.viewMatrix = mat4.copy(camera.viewMatrix, shader.uao.viewMatrix)
                shader.uao.projectionMatrix = mat4.copy(camera.projectionMatrix, shader.uao.projectionMatrix)
                shader.uao.radius = light.radius

                framebuffer.bind(true).attachTexture(shadowmap, 0, face)
                ctx.colorMask = [true, true, false, false]
                ctx.clearColor = [0.0, 0.0, 0.0, 0.0]
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

                light.queryShadowcasters(face).forEach(instance => {
                    const meshData = instance.delegate.data
                    ctx.enableVAO(meshData)
                    shader.uao.modelMatrix = mat4.copy(instance.modelMatrix, shader.uao.modelMatrix)
                    shader.uao.update()
                    ctx.drawElements(meshData.totalSize, meshData.offset)
                })
                
                framebuffer.unbind()
                ctx.restoreState()
            }))
            
            return Signal(done => taskManager.schedule(done.bind(target, shadowmap)))
        },
        bindShadowMap: (shadowMap, light, shader, location = 1) => {
            if(shader.uao.lightProjectionMatrix) shader.uao.lightProjectionMatrix = mat4.copy(light.camera.projectionMatrix, shader.uao.lightProjectionMatrix)
            shader.uao.shadowMap = location
            shadowMap.bind(location)
        }
    }
})