import {tie, factory, URLQuery} from '../../util'
import {vec3, quat, mat4, mat3} from '../../math'
import {flat_color} from './shader'

const createVisualRepresentation = (submeshes, options = {}) => {
    const vertices = [],
          indices = []
    let indexOffset = 0
    submeshes.forEach(submesh => {
        indices.push.apply(indices, submesh.indices.map(index => index + indexOffset))
        vertices.push.apply(vertices, Array.range(submesh.vertices.length).map(index => [...submesh.vertices[index], ...submesh.normals[index]]).flatten())
        indexOffset += submesh.vertices.length
    })
    
    const position = options.position || vec3(0),
          quaternion = options.quaternion || quat(),
          scale = options.scale || vec3(1)
    return Object.assign({
        vertexArray: new Float32Array(vertices),
        indexArray: new Uint16Array(indices),
        dataFormat: [{type: 'position', size: 3, byteSize: 4}, {type: 'normal', size: 3, byteSize: 4}],
        stride: 6,
        color: vec3(0.5),
        position, quaternion, scale,
        modelMatrix: mat4.fromRotationTranslationScale(quaternion, position, scale, mat4())
    }, options)
}

factory.declare('application', target => {
    const ctx = target.ctx,
          gl = ctx.gl,
          scene = target.scene,
          physics = target.physics
    target.debugOptions = URLQuery()
    
    const deferredVisuals = [],
          debugPasses = []
    
    scene.addEventListener('update', _ => {
        if(!deferredVisuals.length) return false
        deferredVisuals.forEach(visual => visual.uploadEvent = ctx.uploadMeshData(visual, null, false).listen(mesh => visual.data = mesh))
        ctx.deferredDataUpload()
        deferredVisuals.length = 0
    })    
    
    const shader = ctx.compileShader(flat_color)
    
    const renderVisual = visual => {
        if(!visual.data) return false
        ctx.enableVAO(visual.data)
        
        shader.uao.modelViewMatrix = mat4.multiply(scene.camera.viewMatrix, visual.modelMatrix, shader.uao.modelViewMatrix)
        shader.uao.color = vec3.copy(visual.color, shader.uao.color)
        shader.uao.update()
        if(visual.wireframe)
            gl.drawElements(gl.LINES, visual.data.totalSize, gl.UNSIGNED_SHORT, Uint16Array.BYTES_PER_ELEMENT * visual.data.offset)
        else
            ctx.drawElements(visual.data.totalSize, visual.data.offset)
    }
    
    ctx.pipeline.pass((ctx, scene, next, frame) => {
        ctx.saveState()
        shader.use()
        
        shader.uao.projectionMatrix = mat4.copy(scene.camera.projectionMatrix, shader.uao.projectionMatrix) 
        debugPasses.forEach(pass => pass.call(ctx, ctx, renderVisual))
        
        ctx.restoreState()
        next()
    })
    
    return {
        addDebugVisuals: (submeshes, options) => {
            const mesh = createVisualRepresentation(submeshes, options)
            deferredVisuals.push(mesh)
            return mesh
        },
        removeDebugVisuals: mesh => {
            deferredVisuals.remove(mesh)
            if(mesh.uploadEvent) mesh.uploadEvent.listen(_ => ctx.unloadData(mesh.data))
        },
        addDebugPass: debugPasses.push.bind(debugPasses)
    }
})

export {createVisualRepresentation}