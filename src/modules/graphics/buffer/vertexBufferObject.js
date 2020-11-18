import {factory, tie, Signal} from '../../util'
import {MAX_INDEX_ARRAY_LENGTH} from '../glutil'

const VertexBufferRange = (vertexArrayLength, vertexArrayOffset, indexArrayLength, indexArrayOffset) => ({ vertexArrayLength, vertexArrayOffset, indexArrayLength, indexArrayOffset })

factory.declare('vbo', (target, {ctx, dynamic}) => {
    const gl = ctx.gl,
          vertexBuffer = gl.createBuffer(),
          indexBuffer = gl.createBuffer()
    let uploadQueue = [], indexBaseOffset = 0
    
    return {
        clear: _ => {
            ctx.clearVBOAttributePointers(target)
            gl.deleteBuffer(vertexBuffer)
            gl.deleteBuffer(indexBuffer)
        },
        bind: _ => {
            if(ctx.onBind('vbo', target)){
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
            }
            return target
        },
        unbind: _ => {
            ctx.onBind('vbo', null)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
            return target
        },
        appendData: (vertexArray, indexArray, vertexCount) => {
            const vertexDataOffset = uploadQueue.reduce((offset, data) => offset + data.vertexArray.length, 0),
                  indexDataOffset = uploadQueue.reduce((offset, data) => offset + data.indexArray.length, 0),
                  uploadEvent = Signal()

            if(indexBaseOffset + vertexCount > MAX_INDEX_ARRAY_LENGTH)
                throw new Error('VBO 16bit Uint Index Array overflow')
            if(target.uploaded) target.migrate = true

            const bufferRange = VertexBufferRange(vertexArray.length, vertexDataOffset, indexArray.length, indexDataOffset)
            uploadQueue.push({vertexArray, indexArray, vertexCount, uploadEvent, bufferRange, indexBaseOffset})
            
            indexBaseOffset += vertexCount
            return {uploadEvent, bufferRange}
        },
        staticUpload: (vertexArray, indexArray) => {
            target.bind()
            gl.bufferData(gl.ARRAY_BUFFER, vertexArray, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW)
            return target
        },
        uploadVertexArray: (vertices, bufferOffset) => {
            target.bind()
            gl.bufferSubData(gl.ARRAY_BUFFER, bufferOffset * Float32Array.BYTES_PER_ELEMENT, vertices)
            return target
        },
        uploadIndexArray: (indices, bufferOffset, indexBaseOffset = 0) => {
            target.bind()
            let idx = indices.length,
                offsetIndexArray = ctx.allocateUint16(idx)
            while(idx--)
                offsetIndexArray[idx] = indices[idx] + indexBaseOffset
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, bufferOffset * Uint16Array.BYTES_PER_ELEMENT, offsetIndexArray)
            return target
        },
        segmentedVertexArrayUpload: (vertices, bufferOffset, segmentLength, segmentOffset) => {
            const segmentView = new Float32Array(vertices.buffer, vertices.byteOffset + Float32Array.BYTES_PER_ELEMENT * segmentOffset, segmentLength)
            return target.uploadVertexArray(segmentView, bufferOffset + segmentOffset)
        },
        segmentedIndexArrayUpload: (indices, bufferOffset, segmentLength, segmentOffset, indexBaseOffset) => {
            const segmentView = new Uint16Array(indices.buffer, indices.byteOffset + Uint16Array.BYTES_PER_ELEMENT * segmentOffset, segmentLength)
            return target.uploadIndexArray(segmentView, bufferOffset + segmentOffset, indexBaseOffset)
        },
        upload: (taskManager, batchSize = Number.MAX_SAFE_INTEGER) => {
            if(!uploadQueue.length || target.uploaded) return false
            const last = uploadQueue[uploadQueue.length-1],
                  vertexDataSize = last.bufferRange.vertexArrayOffset + last.bufferRange.vertexArrayLength,
                  indexDataSize = last.bufferRange.indexArrayOffset + last.bufferRange.indexArrayLength,
                  uploadEvent = Signal()
            target.uploaded = true
            target.bind()
            gl.bufferData(gl.ARRAY_BUFFER, vertexDataSize * Float32Array.BYTES_PER_ELEMENT, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexDataSize * Uint16Array.BYTES_PER_ELEMENT, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW)
            
            if(!taskManager) return uploadQueue.forEach(data => {
                target.uploadVertexArray(data.vertexArray, data.bufferRange.vertexArrayOffset)
                target.uploadIndexArray(data.indexArray, data.bufferRange.indexArrayOffset, data.indexBaseOffset)
                data.uploadEvent.onSuccess(true)
            })
            
            uploadQueue.forEach(data => {
                const bufferRange = data.bufferRange
                let vertexBatchSize = Math.floor(batchSize / Float32Array.BYTES_PER_ELEMENT),
                    vertexBatchCount = Math.ceil(bufferRange.vertexArrayLength / vertexBatchSize),
                    vertexOffset = 0
                while(vertexBatchCount--){
                    vertexBatchSize = Math.min(vertexBatchSize, bufferRange.vertexArrayLength - vertexOffset)
                    taskManager.schedule(target.segmentedVertexArrayUpload.bind(target, data.vertexArray, bufferRange.vertexArrayOffset, vertexBatchSize, vertexOffset))
                    vertexOffset += vertexBatchSize
                }
                
                let indexBatchSize = Math.floor(batchSize / Uint16Array.BYTES_PER_ELEMENT),
                    indexBatchCount = Math.ceil(bufferRange.indexArrayLength / indexBatchSize),
                    indexOffset = 0
                
                while(indexBatchCount--){
                    indexBatchSize = Math.min(indexBatchSize, bufferRange.indexArrayLength - indexOffset)
                    taskManager.schedule(target.segmentedIndexArrayUpload.bind(target, data.indexArray, bufferRange.indexArrayOffset, indexBatchSize, indexOffset, data.indexBaseOffset))
                    indexOffset += indexBatchSize
                }
            })
            taskManager.schedule(uploadEvent.onSuccess.bind(uploadEvent, true))
            uploadEvent.listen((events => events.forEach(event => event.onSuccess(true))).bind(null, uploadQueue.map(data => data.uploadEvent)), null, false)
            return uploadEvent
        },
        unloadData: bufferRange => {
            let bufferRangeIdx = uploadQueue.findIndex(data => data.bufferRange === bufferRange),
                indexShift = uploadQueue[bufferRangeIdx].vertexCount
            indexBaseOffset -= indexShift
            uploadQueue.splice(bufferRangeIdx, 1)
        },
        get uploadQueue(){ return uploadQueue },
        set uploadQueue(value){
            let vertexArrayOffset = 0,
                indexArrayOffset = 0
            uploadQueue = value.map(data => {
                const bufferRange = VertexBufferRange(data.vertexArray.length, vertexArrayOffset, data.indexArray.length, indexArrayOffset)
                vertexArrayOffset += data.vertexArray.length
                indexArrayOffset += data.indexArray.length
                return Object.assign({}, data, {bufferRange, inheritBufferRange: data.bufferRange})
            })
            indexBaseOffset = uploadQueue.reduce((offset, data) => (data.indexBaseOffset = offset, offset + data.vertexCount), 0)
        },
        inherit: _ => {
            uploadQueue.filter(data => data.inheritBufferRange).forEach(data => data.bufferRange = Object.assign(data.inheritBufferRange, data.bufferRange))
            return target
        }
    }
})

export {VertexBufferRange}