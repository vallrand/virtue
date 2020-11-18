/*
|HEADER uin32: vertexArray.length | indexArray.length | hierarchy.length | animations.length | dataFormat.length | materials.length
|VERTICES float32 interleaved buffer data
|BONES float32: [ parentId | buffer offset | buffer length | 16* bindPose | 16* localTransform ]
|ANIMATION float32: [ bones | [ boneId | frames | [ time, position, rotation ]*frames ]*bones ]
|INDICES uint16
|FORMAT uint16: [ 8 - type | 2 - size | 2 - byteSize ]
|materials uint8: JSON [[[boneId, ..], [filename, ..], ..], ..]
*/

const VERTEX_ATTRIBUTE_TYPE = {
    'position': 0x0001,
    'normal':   0x0002,
    'uv':       0x0004,
    'joint':    0x0008,
    'weight':   0x0010,
    'tangent':  0x0020,
    'color':    0x0040,
    '_1':       0x0080,
    '_2':       0x0100
}
const mapAttrbuteName = (attributeTypes => type => attributeTypes.find(attrName => VERTEX_ATTRIBUTE_TYPE[attrName] === type))(Object.keys(VERTEX_ATTRIBUTE_TYPE))

const ATTRIBUTE_VALUE_TYPE = [
    'BYTE',
    'UNSIGNED_BYTE',
    'SHORT',
    'UNSIGNED_SHORT',
    'FLOAT'
]

const HEADER_LENGTH = 8
const JOINT_LENGTH = 16 + 16 + 4 

const log2 = val => { for(let n = 0; n < 32; (val = val >> 1) ? n++ : (val = n, n = 32)); return val; }
const pow2 = val => (2 << (val-1)) || 1

const decodeBuffer = arraybuffer => {
    const header = new Uint32Array(arraybuffer, 0, HEADER_LENGTH),
          vertexArray = new Float32Array(arraybuffer, header.byteOffset + header.byteLength, header[0]),
          jointArray = new Float32Array(arraybuffer, vertexArray.byteOffset + vertexArray.byteLength, header[2] * JOINT_LENGTH),
          animationArray = new Float32Array(arraybuffer, jointArray.byteOffset + jointArray.byteLength, header[3]),
          indexArray = new Uint16Array(arraybuffer, animationArray.byteOffset + animationArray.byteLength, header[1]),
          formatArray = new Uint16Array(arraybuffer, indexArray.byteOffset + indexArray.byteLength, header[4]),
          materialArray = new Uint8Array(arraybuffer, formatArray.byteOffset + formatArray.byteLength, header[5]),
          dataFormat = Array.prototype.slice.call(formatArray).map(attr => ({type: mapAttrbuteName(pow2(attr >> 8)), size: (attr & 0x03)+1, byteSize: ((attr & 0x0F) >> 2)+1})),
          stride = dataFormat.reduce((size, attr) => size + attr.size, 0),
          boneHierarchy = Array(header[2]).fill().map((_, idx) => idx * JOINT_LENGTH).map((offset, idx) => ({
              parent: jointArray[offset + 0],
              bufferOffset: jointArray[offset + 1],
              bufferLength: jointArray[offset + 2],
              //_: jointArray[offset + 3],
              bindPose: new Float32Array(jointArray.buffer, jointArray.byteOffset + (offset + 4) * Float32Array.BYTES_PER_ELEMENT, 16),
              localTransform: new Float32Array(jointArray.buffer, jointArray.byteOffset + (offset + 4 + 16) * Float32Array.BYTES_PER_ELEMENT, 16)
          })),
          materials = materialArray.length === 0 ? null : JSON.parse(String.fromCharCode.apply(null, materialArray)).map(material => ({bones: material[0], textureNames: material.slice(1)})),
          animationLayers = []
    let idx = 0
    while(idx < animationArray.length)
        animationLayers.push(Array(animationArray[idx++]).fill().reduce((bones, _) => (
            bones[animationArray[idx++]] = Array(animationArray[idx++]).fill().map(_ => ({
                time: animationArray[idx++],
                position: new Float32Array([animationArray[idx++], animationArray[idx++], animationArray[idx++]]),
                rotation: new Float32Array([animationArray[idx++], animationArray[idx++], animationArray[idx++], animationArray[idx++]])
            })), bones), []))
    for(let offset = 0, i = 0; i < dataFormat.length; offset += dataFormat[i++].size)
        dataFormat[i].offset = offset
    return {
        indexArray, vertexArray, dataFormat, stride, 
        armature: boneHierarchy.length ? (boneHierarchy.unshift(null), boneHierarchy) : null, 
        animation: animationLayers.length ? animationLayers : null, materials
    }
}

const encodeBuffer = (vertexArray, indexArray = [], dataFormat, hierarchy = [], animation = [], materials) => {
    const arraybuffer = new ArrayBuffer(HEADER_LENGTH * Uint32Array.BYTES_PER_ELEMENT +
                                       vertexArray.length * Float32Array.BYTES_PER_ELEMENT +
                                       hierarchy.length * JOINT_LENGTH * Float32Array.BYTES_PER_ELEMENT +
                                       (animation.totalLength = animation.reduce((length, layer) => length + 1 + 
                                            (layer.totalLength = layer.reduce((l, tm) => l + (2 + tm.frameCount * (1+3+4)), 0)), 0)) * Float32Array.BYTES_PER_ELEMENT +
                                       indexArray.length * Uint16Array.BYTES_PER_ELEMENT +
                                       dataFormat.length * Uint16Array.BYTES_PER_ELEMENT +
                                       (materials = materials ? JSON.stringify(materials,null,0) : '').length * Uint8Array.BYTES_PER_ELEMENT
                                       ),
          headerView = new Uint32Array(arraybuffer, 0, HEADER_LENGTH),
          vertView = new Float32Array(arraybuffer, headerView.byteOffset + headerView.byteLength, vertexArray.length),
          jointView = new Float32Array(arraybuffer, vertView.byteOffset + vertView.byteLength, hierarchy.length * JOINT_LENGTH),
          animationView = new Float32Array(arraybuffer, jointView.byteOffset + jointView.byteLength, animation.totalLength),
          indexView = new Uint16Array(arraybuffer, animationView.byteOffset + animationView.byteLength, indexArray.length),
          formatView = new Uint16Array(arraybuffer, indexView.byteOffset + indexView.byteLength, dataFormat.length),
          materialView = new Uint8Array(arraybuffer, formatView.byteOffset + formatView.byteLength, materials.length)
    headerView[0] = vertexArray.length
    headerView[1] = indexArray.length
    headerView[2] = hierarchy.length
    headerView[3] = animation.totalLength
    headerView[4] = dataFormat.length
    headerView[5] = materials.length
    //headerView[6] = ? headerView[7] = ?
    dataFormat.forEach((attr, idx) => formatView[idx] = (log2(VERTEX_ATTRIBUTE_TYPE[attr.type]) << 8) + ((attr.byteSize-1) << 2) + (attr.size-1))
    hierarchy.forEach((bone, boneIdx) => {
        const offset = boneIdx * JOINT_LENGTH
        let index = 0
        jointView[offset + index++] = bone.parent
        jointView[offset + index++] = bone.bufferOffset || 0
        jointView[offset + index++] = bone.bufferLength || 0
        jointView[offset + index++] = 0
        bone.bindPose.forEach(val => jointView[offset + index++] = val)
        bone.localTransform.forEach(val => jointView[offset + index++] = val)
    })
    animation.reduce((offset, layer) => (animationView[offset++] = layer.length,
        layer.forEach(bone => {
            animationView[offset++] = bone.boneId
            animationView[offset++] = bone.frameCount
            bone.frames.forEach(frame => {
                animationView[offset++] = frame.time;        animationView[offset++] = frame.position[0]; animationView[offset++] = frame.position[1]; animationView[offset++] = frame.position[2]
                animationView[offset++] = frame.rotation[0]; animationView[offset++] = frame.rotation[1]; animationView[offset++] = frame.rotation[2]; animationView[offset++] = frame.rotation[3]
            })
        }), offset), 0)
    indexArray.forEach((value, idx) => indexView[idx] = value)
    vertexArray.forEach((value, idx) => vertView[idx] = value)
    materials.split('').forEach((char, charIdx) => materialView[charIdx] = char.charCodeAt(0) & 0xFF)
    return new Uint8Array(arraybuffer)
}

export {VERTEX_ATTRIBUTE_TYPE, mapAttrbuteName, encodeBuffer, decodeBuffer}