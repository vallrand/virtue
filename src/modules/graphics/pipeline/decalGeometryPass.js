import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {vec2, vec3, vec4, quat, mat3, mat4} from '../../math'

const decal_geometry = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    .extension('GL_EXT_frag_depth')

    .main([
        'vec4 color = texture2D(albedo, vTexCoords);',

        'if(color.a <= 0.1) discard;',

        '#ifdef GL_EXT_frag_depth',
        'gl_FragDepthEXT = gl_FragCoord.z - 0.000001;',
        '#endif',

        'vec3 normal = normalize(vNormal);',
        'vec3 viewDirection = normalize(vViewDir);',
        'vec3 totalLight = calcLighting(normal, viewDirection);',
        'gl_FragColor = vec4(applyFog(totalLight * color.rgb), color.a);'
    ])
}

export const DecalGeometryPass = (ctx, scene, lightmapping = true) => {
    const gl = ctx.gl
    const dataFormat = [
        { type: 'position', size: 3, byteSize: 4 },
        { type: 'normal', size: 3, byteSize: 4 },
        { type: 'uv', size: 2, byteSize: 4 }
    ].concat(lightmapping ? [
        { type: 'lm_uv', size: 2, byteSize: 4 }
    ] : [])

    const shader = lightmapping ? ctx.compileShader(vglsl.merge(shaders.static_geometry, shaders.fog_exp, shaders.render_lightmap, decal_geometry)) : null
    shader.uao.albedo = 0
    
    scene.camera.mutation.pipe(mutations => {
        if(mutations.projectionMatrix) shader.uao.Pmat = mat4.copy(mutations.projectionMatrix, shader.uao.Pmat)
        if(mutations.viewMatrix) shader.uao.MVmat = mat4.copy(mutations.viewMatrix, shader.uao.MVmat)
    }, false)
    scene.environment.mutation.pipe(mutations => {
        if(mutations.fogColor) shader.uao.fogColor = vec3.copy(mutations.fogColor, shader.uao.fogColor) //TODO can remove copy, just assign
        if(mutations.fogDensity) shader.uao.fogDensity = mutations.fogDensity
    })

    const decalRegions = Object.create(null)
    function updateRegion(cluster){ //TODO async deferred
        //TODO zones load multiple times?
        if(decalRegions[cluster.index] && decalRegions[cluster.index].uploadEvent){
            decalRegions[cluster.index].uploadEvent.listen(mesh => mesh.unload())
            delete decalRegions[cluster.index]
            //TODO clear
        }
        const staticGeometry = cluster.pointers.slice()
        const decals = scene.fetchInstancesByGroup('decal').map(({ instances }) => instances).flatten()
        
        const regionData = Object.create(null)
        decalRegions[cluster.index] = regionData
        regionData.uploadEvent = ctx.batchDecals(decals, staticGeometry, dataFormat).pipe(meshData => {
            Object.assign(regionData, meshData)
            return ctx.uploadMeshData(meshData, null, true).pipe(mesh => regionData.data = mesh)
        })
    }
    scene.clusterPartitioning.addEventListener('complete', updateRegion)
    scene.clusterPartitioning.addEventListener('remove', updateRegion)

    return (ctx, scene, next, frame) => {
        ctx.depthTest = true
        ctx.depthMask = false
        ctx.culling = 'back'
        shader.use()
        
        const regions = scene.clusterPartitioning.clusters
        let regionIdx = regions.length
        while(regionIdx--){
            const mesh = decalRegions[regions[regionIdx].index]
            if(!mesh || !mesh.data) continue
            ctx.enableVAO(mesh.data)
            let submeshIdx = mesh.submeshes.length,
                submesh = null
            while(submeshIdx--){
                submesh = mesh.submeshes[submeshIdx]
                
                if(submesh.instance.frameFlag !== frame){
                    submesh.instance.frameFlag = frame
                    submesh.instance.visible = scene.camera.frustumCulling(submesh.instance)
                }
                if(!submesh.instance.visible) continue
                
                ctx.bindTextures(submesh.materials)
                if(lightmapping) ctx.bindLightmap(submesh.delegate, shader)
                shader.uao.update()
                ctx.drawElements(submesh.length, mesh.data.offset + submesh.offset)
            }
        }
        next()
    }
}