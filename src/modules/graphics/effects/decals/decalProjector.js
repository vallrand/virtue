import {factory, Signal, tie} from '../../../util'
import {vec2, vec3, vec4, quat, mat3, mat4, lerp} from '../../../math'
import { aquireVec2Pool, aquireVec3Pool } from '../../../physics/math'
import { clipFace } from './util'

factory.declare('gl_context', (target, options) => {
    const gl = target.gl,
          ctx = target,
          taskManager = options.manager
    const clippingPlanes = [
        vec3(1, 0, 0), vec3(-1, 0, 0),
        vec3(0, 1, 0), vec3(0, -1, 0),
        vec3(0, 0, 1), vec3(0, 0, -1)
    ]
    
    const enabledPlanes = vec3(1, 1, 1) //TODO configurable per decal
    return {
        batchDecals(decals, staticGeometry, dataFormat){
            const positionD = vec3()
            const positionG = vec3()

            const vertices = [],
                  indices = [],
                  submeshes = []
            let indexOffset = 0
            
            staticGeometry.forEach(geometry => {
                vec3.translationFromMat4(geometry.modelMatrix, positionG)
                decals.forEach(decal => {
                    vec3.translationFromMat4(decal.modelMatrix, positionD)
                    
                    const minDistance = geometry.boundingSphereRadius + decal.boundingSphereRadius
                    if(vec3.differenceSquared(positionG, positionD) > minDistance * minDistance)
                        return false
                    
                    let mesh = null
                    taskManager.schedule(function(){
                        mesh = ctx.projectDecal(decal, geometry, dataFormat)
                    })
                    taskManager.schedule(function(){
                        if(!mesh.indices.length) return
                        
                        submeshes.push({
                            instance: decal,
                            materials: [decal.delegate],
                            delegate: geometry,
                            offset: indices.length,
                            length: mesh.indices.length
                        })
                        indices.push.apply(indices, mesh.indices.map(index => index + indexOffset))
                        vertices.push.apply(vertices, mesh.vertices)
                        indexOffset += mesh.vertexCount
                    })
                })
            })
            
            return Signal(done => taskManager.schedule(() => done({
                vertexArray: new Float32Array(vertices),
                indexArray: new Uint16Array(indices),
                submeshes,
                dataFormat,
                stride: dataFormat.reduce((total, { size }) => total + size, 0)
            })))
        },
        projectDecal(decal, geometry, outputDataFormat){
            const vec3Pool = aquireVec3Pool()
            const vec2Pool = aquireVec2Pool()
            
            const uvBounds = decal.uvBounds || [[0,1],[0,1]]
            const modelMatrix = decal.modelMatrix
            const normalMatrix = mat3.fromMat4(geometry.modelMatrix, mat3())
            const localMatrix = mat4.invert(modelMatrix, mat4())
            mat4.multiply(localMatrix, geometry.modelMatrix, localMatrix)
            
            const { dataFormat, indexArray, vertexArray, stride } = geometry.delegate.data.internalData
            let vertexCount = vertexArray.length / stride
            const offsets = dataFormat.reduce((map, format) => Object.assign(map, { [format.type]: format.offset }), {})
            const vertexAttributes = outputDataFormat.reduce((map, format) => Object.assign(map, { [format.type]: format.type in offsets }), {})
            
            const cachedVertices = Array(vertexCount)
            
            const insertVertex = index => cachedVertices[index] = {
                index,
                position: vec3Pool.obtain(),
                uv: vec2Pool.obtain(),
                normal: vertexAttributes.normal && vec3Pool.obtain(),
                lm_uv: vertexAttributes.lm_uv && vec2Pool.obtain()
            }
            
            const splitVertices = Object.create(null)
            const interpolateVertex = (v0, v1, s) => {
                const key = `${v0.index}-${v1.index}-${Math.floor(s * 1e3)}`
                if(key in splitVertices) return cachedVertices[splitVertices[key]]
                splitVertices[key] = vertexCount
                
                const vertex = insertVertex(vertexCount++)
                vec3.lerp(v0.position, v1.position, s, vertex.position)
                if(vertex.normal) vec3.lerp(v0.normal, v1.normal, s, vertex.normal)
                if(vertex.lm_uv) vec2.lerp(v0.lm_uv, v1.lm_uv, s, vertex.lm_uv)
                return vertex
            }
            let vertexList = []
            for(let i = 0; i < indexArray.length; i+=3){
                let faceVertices = Array(3)
                for(let j = 0; j < 3; j++){
                    let index = indexArray[i + j]
                    
                    if(cachedVertices[index]){
                        faceVertices[j] = cachedVertices[index]
                        continue
                    }
                    
                    const vertex = insertVertex(index)
                    vec3.set(
                        vertexArray[index * stride + offsets.position + 0],
                        vertexArray[index * stride + offsets.position + 1],
                        vertexArray[index * stride + offsets.position + 2],
                        vertex.position
                    )
                    if(vertex.normal) vec3.set(
                        vertexArray[index * stride + offsets.normal + 0],
                        vertexArray[index * stride + offsets.normal + 1],
                        vertexArray[index * stride + offsets.normal + 2],
                        vertex.normal
                    )
                    if(vertex.lm_uv) vec2.set(
                        vertexArray[index * stride + offsets.lm_uv + 0],
                        vertexArray[index * stride + offsets.lm_uv + 1],
                        vertex.lm_uv
                    )
                    
                    vec4.transform(vertex.position, localMatrix, vertex.position)
                    faceVertices[j] = vertex
                }
                
                if(enabledPlanes[0]){
                    faceVertices = clipFace(interpolateVertex, faceVertices, clippingPlanes[0])
                    faceVertices = clipFace(interpolateVertex, faceVertices, clippingPlanes[1])
                }
                if(enabledPlanes[1]){
                    faceVertices = clipFace(interpolateVertex, faceVertices, clippingPlanes[2])
                    faceVertices = clipFace(interpolateVertex, faceVertices, clippingPlanes[3])
                }
                if(enabledPlanes[2]){
                    faceVertices = clipFace(interpolateVertex, faceVertices, clippingPlanes[4])
                    faceVertices = clipFace(interpolateVertex, faceVertices, clippingPlanes[5])
                }
                
                vertexList = vertexList.concat(faceVertices)
            }

            for(let i = cachedVertices.length - 1; i >= 0; i--){
                let vertex = cachedVertices[i]
                if(!vertex) continue
                
                vertex.uv[0] = lerp(uvBounds[0][0], uvBounds[0][1], 0.5 + vertex.position[0])
                vertex.uv[1] = lerp(uvBounds[1][0], uvBounds[1][1], 0.5 + vertex.position[1])

                if(!target.extensions['frag_depth']) vertex.position[2] -= 1e-3
                
                vec4.transform(vertex.position, modelMatrix, vertex.position)
                if(vertex.normal) vec3.transformMat3(vertex.normal, normalMatrix, vertex.normal)
            }
            
            const vertices = []
            const indices = []
            const duplicate = []
            
            let indexOffset = 0
            
            for(let i = 0; i < vertexList.length; i++){
                const vertex = vertexList[i]
                
                if(duplicate[vertex.index] != null){
                    indices.push(duplicate[vertex.index])
                    continue
                }else{
                    duplicate[vertex.index] = indexOffset++
                    indices.push(duplicate[vertex.index])
                    
                    for(let j = 0; j < outputDataFormat.length; j++){
                        let { type, size } = outputDataFormat[j]
                        for(let k = 0; k < size; k++)
                            vertices.push(vertex[type][k])
                    }
                }
            }
            vec2Pool.release()
            vec3Pool.release()
            return {
                vertices, indices, vertexCount: indexOffset
            }
        }
    }
})