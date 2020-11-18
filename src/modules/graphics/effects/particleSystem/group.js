import {tie, factory} from '../../../util'
import {vec3, vec4} from '../../../math'
import {InterleavedArrayIterator} from './util'
import {ParticleEmitter} from './emitter'

factory.declare('particle_system', (target, { ctx }) => { //TODO better place to put common functionality?
    const gl = ctx.gl,
          vertexBuffer = gl.createBuffer(),
          indexBuffer = gl.createBuffer()
    
    return {
        uploadRange: (startIndex, endIndex, vertexArray) => {            
            target.bind()
            const dataView = new Float32Array(vertexArray.buffer, startIndex * Float32Array.BYTES_PER_ELEMENT, endIndex - startIndex)
            gl.bufferSubData(gl.ARRAY_BUFFER, startIndex * Float32Array.BYTES_PER_ELEMENT, dataView)
            return target
        },
        upload: (vertexArray, indexArray) => { //TODO maybe move that into vbo?
            target.bind()
            
            if(vertexArray instanceof Float32Array)
                gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW)
            else if(!isNaN(vertexArray))
                gl.bufferData(gl.ARRAY_BUFFER, vertexArray * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW)
                
            if(indexArray instanceof Uint16Array)
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW)
            
            return target
        },
        bind: _ => { //TODO common VBO methods?
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
        clear: _ => {
            ctx.clearVBOAttributePointers(target)
            gl.deleteBuffer(vertexBuffer)
            gl.deleteBuffer(indexBuffer)
        }
    }
})

factory.declare('particle_system', (target, { format, limit }) => {
    const arrayIterator = InterleavedArrayIterator(size => new Float32Array(size * limit), format),
          emitters = [],
          reservedRanges = [],
          deferredRanges = [],
          requireRange = size => {
              let index, offset = 0
              for(index = 0; index < reservedRanges.length; index++){
                  if(reservedRanges[index][0] - offset >= size) break
                  offset = reservedRanges[index][1]
              }
              const range = [offset, offset + size]
              reservedRanges.splice(index, 0, range)
              return range
          },
          deferRangeUpload = range => {
              const mergeThreshold = limit / 16
              for(let i = deferredRanges.length - 1; i >= 0; i--){
                  let mergedRange = deferredRanges[i]
                  let t = mergedRange.slice()
                  if(range[0] > mergedRange[1] + mergeThreshold || range[1] < mergedRange[0] - mergeThreshold) continue
                  mergedRange[0] = Math.min(mergedRange[0], range[0])
                  mergedRange[1] = Math.max(mergedRange[1], range[1])
                  return true
              }
              deferredRanges.push(range)
          }
    
    target.upload(arrayIterator.array.length, new Uint16Array(Array.range(limit).map(i => [0,1,2,0,2,3].map(idx => idx + i * 4)).flatten()))
    
    return {
        arrayIterator,
        get emitters(){ return emitters },
        createEmitter: options => {
            const emitter = ParticleEmitter(target, options)
            emitters.push(emitter)
            return emitter
        },
        allocate: (count, particleSettings) => {
            const parameterNames = Object.keys(particleSettings),
                  range = requireRange(count),
                  indexOffset = range[0]
            for(let i = 0; i < count; i++){
                arrayIterator.index = indexOffset + i
                arrayIterator.init()
                parameterNames.forEach(param => {
                    let value = particleSettings[param]
                    if(typeof value === 'function') value = value.call(target, i, count, particleSettings)
                    arrayIterator[param] = value
                })
            }
            deferRangeUpload(range.slice())
            return range
        },
        update: (indexOffset, count, particleSettings) => {
            const parameterNames = Object.keys(particleSettings)
            for(let i = 0; i < count; i++){
                arrayIterator.index = indexOffset + i
                parameterNames.forEach(param => {
                    let value = particleSettings[param]
                    if(typeof value === 'function') value = value.call(target, i, count, particleSettings)
                    arrayIterator[param] = value
                })
            }
            deferRangeUpload([indexOffset, indexOffset + count])
        },
        syncBufferData: _ => {
            if(!deferredRanges) return true
            deferredRanges.forEach(range => target.uploadRange(range[0] * arrayIterator.stride, range[1] * arrayIterator.stride, arrayIterator.array))
            deferredRanges.length = 0
        }
    }
})