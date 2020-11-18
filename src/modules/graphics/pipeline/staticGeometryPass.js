import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {vec3, mat3, mat4} from '../../math'

export const StaticGeometryPass = (ctx, scene, lightmapping = true) => {
    const gl = ctx.gl,
          shader = lightmapping ? ctx.compileShader(vglsl.merge(shaders.static_geometry, shaders.fog_exp, shaders.render_lightmap))
          : ctx.compileShader(vglsl.merge(shaders.static_geometry, shaders.fog_exp, shaders.blinn_phong, shaders.ambient_light))
    shader.uao.albedo = 0
    
    scene.camera.mutation.pipe(mutations => {
        if(mutations.projectionMatrix) shader.uao.Pmat = mat4.copy(mutations.projectionMatrix, shader.uao.Pmat)
    })
    scene.environment.mutation.pipe(mutations => {
        if(mutations.fogColor){
            shader.uao.fogColor = vec3.copy(mutations.fogColor, shader.uao.fogColor) //TODO can remove copy, just assign
            ctx.clearColor = vec3.copy(mutations.fogColor, ctx.clearColor)
        }
        if(mutations.fogDensity) shader.uao.fogDensity = mutations.fogDensity
    })
    
    if(lightmapping){
        scene.clusterPartitioning.addEventListener('complete', ctx.lightmapper.updateRegion.bind(ctx, scene.lights))
        scene.clusterPartitioning.addEventListener('remove', ctx.lightmapper.updateRegion.bind(ctx, scene.lights))
        //scene.lights.mutation -> listen for all existing lights? capture all changes?
        
        scene.addEventListener('light', light => light.queryShadowcasters()
                               .map(instance => instance.partitionCluster)
                               .filter(cluster => cluster && !cluster.awaitEvent)
                               .forEach(cluster => ctx.lightmapper.updateRegion([light], cluster)))
        //TODO light removal and cluster removal? (maybe attach cluster removal to lightmap directly?, or instances?) same for lights
    }
    
    return (ctx, scene, next, frame) => {
        ctx.depthTest = true
        ctx.depthMask = true
        ctx.culling = 'back'
        //shader.use()
        
        const geometry = scene.fetchInstancesByGroup('static')
        let meshIdx = geometry.length,
            subMeshIdx = null,
            instanceIdx = null,
            mesh = null,
            meshData = null,
            subMesh = null,
            instance = null
        while(meshIdx--){
            mesh = geometry[meshIdx]
            if(!mesh.loaded) continue
            meshData = mesh.data
            //ctx.enableVAO(meshData)
            subMeshIdx = meshData.subMeshes.length
            while(subMeshIdx--){
                subMesh = meshData.subMeshes[subMeshIdx]
                //subMesh.material && ctx.bindTextures(subMesh.material.textures)
                instanceIdx = mesh.instances.length
                while(instanceIdx--){
                    instance = mesh.instances[instanceIdx]
                    if(instance.frameFlag !== frame){
                        instance.frameFlag = frame
                        instance.visible = scene.camera.frustumCulling(instance)
                    }
                    if(!instance.visible) continue
                    
                    shader.use()
                    ctx.enableVAO(meshData)
                    subMesh.material && ctx.bindTextures(subMesh.material.textures)
                    
                    if(lightmapping) ctx.bindLightmap(instance, shader)
                    shader.uao.MVmat = mat4.multiply(scene.camera.viewMatrix, instance.modelMatrix, shader.uao.MVmat)
                    shader.uao.update()
                    ctx.drawElements(subMesh.bufferLength, meshData.offset + subMesh.bufferOffset)
                }
            }
        }
        next()
    }
}