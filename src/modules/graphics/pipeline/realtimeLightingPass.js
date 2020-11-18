import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {vec3, mat3, mat4} from '../../math'

const RealtimeLightingPass = (ctx, scene) => {
    const gl = ctx.gl,
          shader = ctx.compileShader(vglsl.merge(shaders.static_geometry, shaders.fog_exp, shaders.blinn_phong, shaders.ambient_light))
    shader.uao.albedo = 0
    
    //TODO connect to environment settings
    shader.uao.ambient = [0.2, 0.2, 0.2]
    shader.uao.sun.direction = vec3.normalize([0.5, 1, 0.5])
    shader.uao.sun.color = [0.4, 0.4, 0.4]
    
    scene.camera.mutation.pipe(mutations => {
        if(mutations.projectionMatrix) shader.uao.Pmat = mat4.copy(mutations.projectionMatrix, shader.uao.Pmat)
    })
    scene.environment.mutation.pipe(mutations => {
        if(mutations.fogColor) shader.uao.fogColor = vec3.copy(mutations.fogColor, shader.uao.fogColor)
        if(mutations.fogDensity) shader.uao.fogDensity = mutations.fogDensity
    })
    
    return (ctx, scene, next, frame) => {
        ctx.depthTest = true
        ctx.culling = 'back'
        
        const geometry = scene.fetchInstancesByGroup('dynamic')
        let meshIdx = geometry.length
        while(meshIdx--){
            let mesh = geometry[meshIdx]
            if(!mesh.loaded) continue
            let subMeshIdx = mesh.data.subMeshes.length
            while(subMeshIdx--){
                let subMesh = mesh.data.subMeshes[subMeshIdx]
                let instanceIdx = mesh.instances.length
                while(instanceIdx--){
                    let instance = mesh.instances[instanceIdx]
                    if(instance.frameFlag !== frame) 
                        instance.visible = scene.camera.frustumCulling(instance)
                    if(!instance.visible) continue
                    
                    shader.use()
                    ctx.enableVAO(mesh.data)
                    subMesh.material && ctx.bindTextures(subMesh.material.textures)
                    
                    shader.uao.MVmat = mat4.multiply(scene.camera.viewMatrix, instance.modelMatrix, shader.uao.MVmat)
                    shader.uao.update()
                    ctx.drawElements(subMesh.bufferLength, mesh.data.offset + subMesh.bufferOffset)
                }
            }
        }
        next()
    }
}

export {RealtimeLightingPass}