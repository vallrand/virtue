import {factory, tie} from '../util'
import {vec3} from '../math'

//TODO move function somewhere else
const calcBoundingSphere = (vertexData, format) => {
    const stride = format.reduce((size, attr) => attr.size + size, 0),
          positionsOffset = format.slice(0, format.findIndex(attr => attr.type === 'position')).reduce((size, attr) => attr.size + size, 0)
    let vertices = vertexData.length / stride,
        position = vec3(),
        maxRadius = 0
    while(vertices--)
        maxRadius = Math.max(vec3.sqrtLength(vec3.copy([vertexData[vertices*stride], vertexData[vertices*stride+1], vertexData[vertices*stride+2]], position)), maxRadius)
    return Math.sqrt(maxRadius)
}

factory.declare('mesh', (target, options) => { //TODO refactor, especially subMesh part.
    //console.log(target, options)
    const bufferRange = options.bufferRange,
          armature = options.meshData.armature ? factory.build('armature', {bones: options.meshData.armature, animation: options.meshData.animation}) : null,
          materials = options.meshData.materials || [{textures:[], bones:[]}],
          subMeshes = options.meshData.armature ? options.meshData.armature.slice(1)
    .filter(subMesh => subMesh.bufferLength)
    .map((subMesh, id) => Object.assign(subMesh, {material: materials.find(material => material.bones.indexOf(id + 1) > -1) || materials[0] }))
    : [{get bufferLength(){ return target.totalSize }, bufferOffset: 0, material: materials[0]}]
    
    
    //todo iterate in material order, merge with the same one. Need example
    return {
        bufferRange, armature, materials, subMeshes,
        vboIdx: options.vboIdx,
        vdfIdx: options.vdfIdx,
        get totalSize(){ return bufferRange.indexArrayLength },
        get offset(){ return bufferRange.indexArrayOffset },
        get vertexDataFormat(){ return options.meshData.dataFormat },
        boundingSphereRadius: calcBoundingSphere(options.meshData.vertexArray, options.meshData.dataFormat),
        get internalData(){ return options.meshData }
    }
})

export {calcBoundingSphere}