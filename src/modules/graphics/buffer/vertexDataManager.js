import {logger} from '../../debug/logger'
import {factory, tie} from '../../util'

const UPLOAD_BATCH_SIZE = 1024*4

factory.declare('gl_context', (target, options) => {
    const gl = target.gl,
          taskManager = options.manager,
          VBOs = [],
          VAOs = [],
          VDFs = [],
          attributePointers = []
    let uploadQueueLength = 0
    
    return {
        uploadMeshData: (meshData, groupId, upload = false) => {
            const vdfIdx = (groupId || VDFs.findIndex(format => Object.deepEquals(format, meshData.dataFormat)) + 1 || VDFs.length + 1) - 1,
                  vdf = VDFs[vdfIdx] || (VDFs[vdfIdx] = meshData.dataFormat),
                  vertexCount = meshData.vertexArray.length / meshData.stride,
                  
                  vboIdx = (VBOs.findIndex(vbo => vbo.vdfIdx === vdfIdx) + 1 || VBOs.length + 1) - 1,
                  vbo = VBOs[vboIdx] || (VBOs[vboIdx] = Object.assign(factory.build('vbo', {ctx: target}), {vdfIdx, vboIdx})),
                  
                  vao = VAOs[vboIdx] || (VAOs[vboIdx] = factory.build('vao', {ctx: target})).setup(vbo, meshData.dataFormat),
                  uploadResponse = vbo.appendData(meshData.vertexArray, meshData.indexArray, vertexCount),
                  mesh = factory.build('mesh', { vdfIdx, vboIdx, bufferRange: uploadResponse.bufferRange, meshData })
            logger.info('buffer', `Scheduled buffer(${vboIdx}) data upload. vertices: ${vertexCount} indices: ${meshData.indexArray.length}`)
            if(upload) taskManager.schedule(target.uploadBuffers, false)
            uploadQueueLength++
            return uploadResponse.uploadEvent.pipe(_ => Object.assign(mesh, {unload: target.unloadData.bind(target, mesh)}))
        },
        deferredDataUpload: _ => uploadQueueLength && taskManager.schedule(target.uploadBuffers, false),
        uploadBuffers: _ => {
            logger.info('buffer', `Uploading ${uploadQueueLength}x, total: ${VBOs.length} buffers`)
            uploadQueueLength = 0
            VBOs.forEach(vbo => vbo.migrate ? target.migrateBufferData(vbo) : vbo.upload(taskManager, UPLOAD_BATCH_SIZE))
            return target
        },
        unloadData: mesh => {
            logger.info('buffer', `Unloading ${mesh.bufferRange.indexArrayLength} from buffer(${mesh.vboIdx})`)
            VBOs[mesh.vboIdx].unloadData(mesh.bufferRange)
            return target
        },
        enableVAO: mesh => (VAOs[mesh.vboIdx].bind(), target),
        bindArrayAttribute: (location, size, type, normalized, stride, offset) => {
            const boundVBO = target.bindings['vbo'],
                  attrPointer = attributePointers[location] || (gl.enableVertexAttribArray(location), attributePointers[location] = { buffer: null, properties: new Uint32Array(5) }),
                  props = attrPointer.properties
            if(attrPointer.buffer !== boundVBO || props[0] !== size || props[1] !== type || props[2] != normalized || props[3] !== stride || props[4] !== offset){
                gl.vertexAttribPointer(location, size, type || gl.FLOAT, normalized || false, stride, offset)
                attrPointer.buffer = boundVBO
                props[0] = size; props[1] = type; props[2] = +normalized; props[3] = stride; props[4] = offset
            }
        },
        unbindArrayAttribute: location => (gl.disableVertexAttribArray(location), attributePointers[location] = null),
        clearVBOAttributePointers: vbo => attributePointers.forEach((attrPointer, location) => attrPointer.buffer === vbo && target.unbindArrayAttribute(location)),
        migrateBufferData: vbo => {
            logger.info('buffer', `Migrating buffer(${vbo.vboIdx}) data. Queue length: ${vbo.uploadQueue.length}`)
            const vboIdx = vbo.vboIdx,
                  tempVBO = factory.build('vbo', {ctx: target}),
                  tempVAO = factory.build('vao', {ctx: target})
            tempVBO.uploadQueue = vbo.uploadQueue
            vbo.appendData = tempVBO.appendData
            tempVBO.upload(taskManager, UPLOAD_BATCH_SIZE).listen(_ => {
                VBOs[vboIdx].clear()
                VAOs[vboIdx].clear()
                VBOs[vboIdx] = Object.assign(tempVBO.inherit(), {vdfIdx: vbo.vdfIdx, vboIdx})
                VAOs[vboIdx] = tempVAO
                tempVAO.setup(tempVBO, VDFs[vbo.vdfIdx])
            }, null, false)
        },
        onBind: (base => (location, element) => 
            (element && location === 'vbo' && target.bindings['vao'] && target.bindings['vao'].vboPointer != element && target.bindings['vao'].unbind(),
             base(location, element))
        )(target.onBind)
    }
})

export {UPLOAD_BATCH_SIZE}