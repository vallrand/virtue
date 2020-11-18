import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {vec3, mat3, mat4} from '../../math'

const SkinnedGeometryPass = (ctx, scene, options = {}) => {
    options.dualQuatSkinning = true
    const gl = ctx.gl,
          shader = options.dualQuatSkinning ? ctx.compileShader(vglsl.merge(shaders.geometry, shaders.dualquat_skinning, shaders.fog_exp))
    : ctx.compileShader(vglsl.merge(shaders.geometry, shaders.linear_skinning, shaders.fog_exp))
    shader.uao.albedo = 0
    
    scene.camera.mutation.pipe(mutations => {
        if(mutations.projectionMatrix) shader.uao.projectionMatrix = mat4.copy(mutations.projectionMatrix, shader.uao.projectionMatrix)
    })
    
    scene.environment.mutation.pipe(mutations => {
        if(mutations.fogColor) shader.uao.fogColor = vec3.copy(mutations.fogColor, shader.uao.fogColor)
        if(mutations.fogDensity) shader.uao.fogDensity = mutations.fogDensity
    })

    return (ctx, scene, next, frame) => {
        ctx.depthTest = true
        ctx.culling = 'back'
        shader.use()
            
        const geometry = scene.fetchInstancesByGroup('skinned')
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
            ctx.enableVAO(meshData)
            subMeshIdx = meshData.subMeshes.length
            while(subMeshIdx--){
                subMesh = meshData.subMeshes[subMeshIdx]
                subMesh.material && ctx.bindTextures(subMesh.material.textures)
                instanceIdx = mesh.instances.length
                while(instanceIdx--){
                    instance = mesh.instances[instanceIdx]
                    if(instance.frameFlag !== frame) 
                        instance.visible = scene.camera.frustumCulling(instance)
                    if(!instance.visible) continue
                    
                    shader.uao.modelViewMatrix = mat4.multiply(scene.camera.viewMatrix, instance.modelMatrix, shader.uao.modelViewMatrix)
                    
                    meshData.armature.update(instance.animationClip)
                    instance.applyTransform(meshData.armature)
                    shader.uao.boneMatrix = meshData.armature.jointMatrixArray
                    
                    shader.uao.highlightColor = vec3.copy(instance.highlight, shader.uao.highlightColor)
                    
                    shader.uao.update()
                    ctx.drawElements(subMesh.bufferLength, meshData.offset + subMesh.bufferOffset)
                }
            }
        }

        
        next()
    }
}

export {SkinnedGeometryPass}