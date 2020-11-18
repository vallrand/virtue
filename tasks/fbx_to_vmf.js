import fs from 'fs'
import util from 'util'
import stream from 'stream'
import gutil from 'gulp-util'
import path from 'path'

import {tie} from '../src/modules/util'
import {encodeBuffer, parseFBX} from '../src/tools'

const ATTRIBUTE_FORMAT = {
    position: {type: 'position', size: 3, byteSize: Float32Array.BYTES_PER_ELEMENT},
    normal: {type: 'normal', size: 3, byteSize: Float32Array.BYTES_PER_ELEMENT},
    uv: {type: 'uv', size: 2, byteSize: Float32Array.BYTES_PER_ELEMENT},
    tangent: {type: 'tangent', size: 3, byteSize: Float32Array.BYTES_PER_ELEMENT},
    joint: {type: 'joint', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT},
    weight: {type: 'weight', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT},
    color: {type: 'color', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT},
}

const FBXtoVMF = fbxCtx => {
    const vertices = [],
          indices = [],
          hierarchy = fbxCtx.boneHierarchy.map(({parent, bindPose, localTransform}) => ({parent, bindPose, localTransform}))
    let vertexOffset = 0,
        indexOffset = 0,
        attributeFormat = null,
        animation = [],
        textures = null
    fbxCtx.meshes.forEach(mesh => {
        const vertexToIndexMap = Object.create(null)
        Object.keys(mesh.outVertices).forEach(vertexUid => {
            const vertex = mesh.outVertices[vertexUid]
            vertexToIndexMap[vertexUid] = vertexOffset++
            if(!attributeFormat) attributeFormat = [
                vertex.position ? ATTRIBUTE_FORMAT.position : null,
                vertex.normal ? ATTRIBUTE_FORMAT.normal : null,
                vertex.uv ? ATTRIBUTE_FORMAT.uv : null,
                vertex.weights ? ATTRIBUTE_FORMAT.joint : null,
                vertex.weights ? ATTRIBUTE_FORMAT.weight : null].filter(f => f)
            if(vertex.position) vertices.push(vertex.position[0], vertex.position[1], vertex.position[2])
            if(vertex.normal) vertices.push(vertex.normal[0], vertex.normal[1], vertex.normal[2])
            if(vertex.uv) vertices.push(vertex.uv[0], vertex.uv[1])
            if(vertex.weights) vertices.push(vertex.weights.index[0]-1 || 0, vertex.weights.index[1]-1 || 0, vertex.weights.index[2]-1 || 0, vertex.weights.index[3]-1 || 0)
            if(vertex.weights) vertices.push(vertex.weights.weight[0] || 0, vertex.weights.weight[1] || 0, vertex.weights.weight[2] || 0, vertex.weights.weight[3] || 0)
        })
        mesh.outIndices.forEach(vertexUid => indices.push(vertexToIndexMap[vertexUid]))   
        hierarchy[mesh.boneIdx - 1].bufferOffset = indexOffset
        indexOffset += hierarchy[mesh.boneIdx - 1].bufferLength = mesh.outIndices.length
    })
    //TODO optimise animation frames by removing unnecesary
    //TODO add multiple animations support
    if(fbxCtx.animation)
        animation.push(Object.keys(fbxCtx.animation).map(boneId => {
            const timeline = fbxCtx.animation[boneId],
                  frameCount = timeline.frames.length,
                  frames = timeline.frames.map(({position, rotation, time}) => ({position, rotation, time}))
            return {boneId, frameCount, frames}
        }))

    if(fbxCtx.materials)
        textures = fbxCtx.materials.map(material => [material.bones, 
                                                     material.textures.diffuse ? [material.textures.diffuse.filename] : null,
                                                     material.textures.normal ? [material.textures.normal.filename] : null])

    
    return new Promise((resolve, reject) => {
        
        
        resolve(encodeBuffer(vertices, indices, attributeFormat, hierarchy, animation, textures))
    })
}

const Converter = function(options = { objectMode: true}){ stream.Transform.call(this, options); this.once('end', _ => {}) }
Converter.prototype._transform = function(file, encoding, done){
    if(file.isNull() || file.isDirectory() || !file.isBuffer())
        return (this.push(file), done())
    
    if(!(/fbx$/i).test(path.extname(file.path)))
        return (this.push(file), done())
    
    gutil.log('processing file: ', file.path)
    const data = String(file.contents)
    
    parseFBX(data).then(fbxData => FBXtoVMF(fbxData))
        .then(vmf => {
        const out = new gutil.File({
            cwd: file.cwd,
            base: file.base,
            path: file.path.replace(/\.fbx$/i, '.vmf'),
            contents: Buffer.from(vmf)
        }) 
        return (this.push(out), done())
    }).catch(err => (gutil.log(err),done()))
}
util.inherits(Converter, stream.Transform)

const fbx_to_vmf = () => new Converter()
export default fbx_to_vmf