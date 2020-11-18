import {logger} from '../../debug/logger'
import {factory, Signal, Stream, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {ATTRIBUTE_LOCATIONS} from '../glutil'
import {WRAP_MODE, FILTERING_MODE} from '../texture'
import {vec2, vec3, vec4, mat3, mat4, BinPacker} from '../../math'

const LIGHTMAP_RESOLUTION = Math.pow(2, 4)
const LIGHTMAP_SCALE_FACTOR = Math.pow(2, 5) / Math.pow(2, 8) //TODO adjust relative scale

//TODO move lightmap into separate file
const LightmapTexture = (ctx, width, height) => factory.build('texture', { ctx })
.uploadTexture(null, { width, height, format: ctx.gl.RGBA })
.setTextureParameters({
    wrapMode: WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP),
    filteringMode: FILTERING_MODE.set(FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR, 0)
}).unbind()

const Lightmap = (ctx, {width, height}) => {
    const target = Object.create(null),
          texture = LightmapTexture(ctx, width, height),
          packer = BinPacker(undefined, width, height),
          instances = []
    
    return tie(target, {
        dirtyFlag: true,
        texture,
        get instances(){ return instances },
        updateLayout: _ => {
            packer.clear().insert(instances.map(instanceLightmap => (delete instanceLightmap.bounds.fit, instanceLightmap.bounds)))
            if(!instances.every(instanceLightmap => instanceLightmap.bounds.fit)) return false
            instances.forEach(instanceLightmap => vec2.copy([instanceLightmap.bounds.fit.x / width, instanceLightmap.bounds.fit.y / height], instanceLightmap.offset))
            return target.dirtyFlag = true
        },
        attachInstance: (instance, defer = false) => {
            const lightmapScale = LIGHTMAP_SCALE_FACTOR * LIGHTMAP_RESOLUTION
            const initialBounds = instance.delegate.data.internalData.uvBounds,
                  bounds = {w: initialBounds.w * lightmapScale, h: initialBounds.h * lightmapScale}
            instances.push(instance.lightmap = {
                delegate: target,
                bounds,
                scale: vec2(bounds.w / width, bounds.h / height),
                offset: vec2()
            })
            return defer || target.updateLayout() || (target.detachInstance(instance), false)
        },
        detachInstance: instance => {
            let idx = instances.indexOf(instance.lightmap)
            if(idx == -1) return false
            delete instance.lightmap
            instances.splice(idx, 1)
        }
    })
}

factory.declare('gl_context', (target, options) => {
    const gl = target.gl, ctx = target,
          taskManager = options.manager,
          lightmapScale = LIGHTMAP_RESOLUTION,
          lightShaders = {
              'spotlight': ctx.compileShader(vglsl.merge(shaders.bake_lightmap, shaders.spotlight)),
              'spotlight-shadow': ctx.compileShader(vglsl.merge(shaders.bake_lightmap, shaders.vsm_shadow, shaders.spotlight)),
              'omnilight': ctx.compileShader(vglsl.merge(shaders.bake_lightmap, shaders.omnilight)),
              'omnilight-shadow': ctx.compileShader(vglsl.merge(shaders.bake_lightmap, shaders.vsm_cube_shadow, shaders.omnilight)),
              'hemisphere': ctx.compileShader(vglsl.merge(shaders.bake_lightmap, shaders.hemisphere))
          },
          wireShader = {
              'spotlight': (shader, light) => {
                  shader.uao.light.color = vec3.copy(light.color, shader.uao.light.color)
                  shader.uao.light.direction = vec3.copy(light.direction, shader.uao.light.direction) //TODO use global position
                  shader.uao.light.radius = light.radius
                  shader.uao.light.outerAngle = light.cosOuterAngle
                  shader.uao.light.innerAngle = light.cosInnerAngle
                  shader.uao.lightViewMatrix = mat4.copy(light.camera.viewMatrix, shader.uao.lightViewMatrix)
              },
              'omnilight': (shader, light) => {
                  shader.uao.light.color = vec3.copy(light.color, shader.uao.light.color)
                  shader.uao.light.radius = light.radius
                  //TODO rework omnilight
                  shader.uao.lightPosition = vec3.copy(light.camera.position, shader.uao.lightPosition)
              },
              'hemisphere': (shader, light) => {
                  shader.uao.light.up = vec3.copy(light.up, shader.uao.light.up)
                  shader.uao.light.skyColor = vec3.copy(light.skyColor, shader.uao.light.skyColor)
                  shader.uao.light.groundColor = vec3.copy(light.groundColor, shader.uao.light.groundColor)
              }
          },
          lightmapRegions = Object.create(null),
          clearLightmap = instance => instance.lightmap && instance.lightmap.delegate.detachInstance(instance)
    let framebuffer = null,
        renderTexture = null
    
    return {
        lightmapper: {
            updateRegion: (lights, cluster) => {
                //TODO doesn't rerender if instances or light were moved/changed
                let region = lightmapRegions[cluster.index]
                if(!region){
                    region = { cluster, deferredLights: [], lights: [], lightmaps: [] }
                    region.bake = target.lightmapper.bakeRegion.bind(target, region)
                    region.clear = target.lightmapper.clearRegion.bind(target, region)
                    region.lightCleanup = light => (region.lights.remove(light), region.lightmaps.forEach(lightmap => lightmap.dirtyFlag = true))
                    lightmapRegions[cluster.index] = region
                }
                const deferredLights = lights
                .filter(light => region.lights.indexOf(light) == -1 && region.deferredLights.indexOf(light) == -1)
                .filter(light => !light.boundingSphereRadius || cluster.pointers
                        .find(instance => Math.pow(light.boundingSphereRadius + instance.boundingSphereRadius, 2) > 
                              vec3.differenceSquared(light.camera.position, vec3.translationFromMat4(instance.modelMatrix, vec3.temp))))
                region.deferredLights.push(...deferredLights)
                deferredLights.forEach(light => light.onCleanup(region.deferredLights.remove.bind(region.deferredLights, light)))
                taskManager.schedule(cluster.pointers.length ? region.bake : region.clear, false)
            },
            bakeRegion: region => {
                const instances = region.cluster.pointers,
                      lightmaps = region.lightmaps,
                      instancesPerLightmap = [],
                      deferredLights = region.deferredLights.slice()
                instances.forEach(instance => {
                    instance.onCleanup(clearLightmap)
                    for(let i = 0, maxLightmaps = lightmaps.length; !instance.lightmap && i <= maxLightmaps; i++)
                        (lightmaps[i] = lightmaps[i] || Lightmap(target, {width: lightmapScale*128, height: lightmapScale*128})).attachInstance(instance)
                    if(!instance.lightmap)
                        throw new Error(`Mesh ${instance.delegate.id} ${instance.delegate.data.internalData.uvBounds.w} x ${instance.delegate.data.internalData.uvBounds.h} does not fit into lightmap ${lightmapScale*128}`)
                    const lightmapIdx = lightmaps.indexOf(instance.lightmap.delegate)
                    return (instancesPerLightmap[lightmapIdx] = instancesPerLightmap[lightmapIdx] || []).push(instance)
                })
                region.deferredLights.length = 0
                deferredLights.forEach(light => light.onCleanup(region.lightCleanup))
                region.lights.push(...deferredLights)
                logger.info('lightmap', `Baking lightmap region ${region.cluster.index} instances: ${instances.length} lights: ${deferredLights.length} count: ${lightmaps.length}`)
                
                for(let idx = 0; idx < lightmaps.length; idx++){
                    if(!instancesPerLightmap[idx]) continue
                    const lightmap = lightmaps[idx]
                    if(lightmap.dirtyFlag)
                        target.lightmapper.bakeLightmap(instancesPerLightmap[idx], region.lights, lightmap.texture, lightmap.dirtyFlag = false)
                    else if(deferredLights.length)
                        target.lightmapper.bakeLightmap(instancesPerLightmap[idx], deferredLights, lightmap.texture)
                }
            },
            clearRegion: region => { //TODO use pool for textures and lightmap layouts
                logger.info('lightmap', `Clearing lightmap region ${region.cluster.index} count: ${region.lightmaps.length}`)
                region.lightmaps.forEach(lightmap => lightmap.texture.clear())
                region.lights.forEach(light => light.cleanupProcedures.remove(region.lightCleanup))
                region.deferredLights.length = region.lights.length = region.lightmaps.length = 0
                delete lightmapRegions[region.cluster.index]
            },
            bakeLightmap: (instances, lights, outputTexture, accumulate = true) => {
                if(!renderTexture) renderTexture = LightmapTexture(ctx, lightmapScale*128, lightmapScale*128)
                if(!framebuffer) framebuffer = ctx.pollFramebuffer(renderTexture.width, renderTexture.height).attachTexture(renderTexture)
                
                taskManager.schedule(_ => {
                    ctx.saveState()
                    framebuffer.bind(true)
                    
                    ctx.clearColor = [0.0, 0.0, 0.0, 0.0]
                    accumulate ? ctx.applyFilter(ctx.filters.none, framebuffer, outputTexture) : gl.clear(gl.COLOR_BUFFER_BIT) //TODO async
                    
                    framebuffer.unbind()
                    ctx.restoreState()
                })
                
                lights.forEach(light => {
                    const shadowMap = light.castShadow && ctx.renderShadowMap(light, { blur: true, shared: true })
                    
                    taskManager.schedule(function(){
                        target.lightmapper.bakeLight(light, instances, shadowMap && shadowMap.value)
                    })
                }) //TODO culling of instances
                
                taskManager.schedule(_ => { //TODO optimize. separate attach and render
                    const tempFramebuffer = ctx.pollFramebuffer(outputTexture.width, outputTexture.height).attachTexture(outputTexture)
                    ctx.applyFilter(ctx.filters.dilate, tempFramebuffer, renderTexture)
                    tempFramebuffer.return()
                })
                return Signal(done => taskManager.schedule(done.bind(target, outputTexture)))
            },
            bakeLight: (light, instances, shadowMap) => {
                const shader = lightShaders[`${light.type}${shadowMap ? '-shadow' : ''}`]
                
                ctx.saveState()
                ctx.depthTest = ctx.culling = false
                ctx.blendMode = 'add'
                framebuffer.bind(true)
                shader.use()
                if(shadowMap) ctx.bindShadowMap(shadowMap, light, shader)
                wireShader[light.type](shader, light)
                
                instances.forEach(instance => {
                    if(!instance.lightmap) return
                    ctx.enableVAO(instance.delegate.data)

                    shader.uao.lightmapOffset = vec2.copy(instance.lightmap.offset, shader.uao.lightmapOffset) //lightmap is not defined
                    shader.uao.lightmapScale = vec2.copy(instance.lightmap.scale, shader.uao.lightmapScale)

                    //TODO culling before (in bake lightmaps)
                    shader.uao.modelMatrix = mat4.copy(instance.modelMatrix, shader.uao.modelMatrix)
                    shader.uao.update()
                    ctx.drawElements(instance.delegate.data.totalSize, instance.delegate.data.offset)
                })
                
                framebuffer.unbind()
                ctx.restoreState()
            }
        },
        bindLightmap: (instance, shader, location = 2) => {
            if(!instance.lightmap)
                return target.emptyTexture.bind(location)
            
            const lightmap = instance.lightmap
            
            lightmap.delegate.texture.bind(location)
            shader.uao.lightmap = location
            
            shader.uao.lightmapOffset = vec2.copy(lightmap.offset, shader.uao.lightmapOffset)
            shader.uao.lightmapScale = vec2.copy(lightmap.scale, shader.uao.lightmapScale)
        }
    }
})

export {LIGHTMAP_RESOLUTION, LIGHTMAP_SCALE_FACTOR}