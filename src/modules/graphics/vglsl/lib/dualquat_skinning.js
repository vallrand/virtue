import {vglsl} from '../vglsl'
import {MAX_BONES_PER_MESH} from '../../glutil'
/*
const dualquat_skinning = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    .attribute('vec3', 'normal')
    .attribute('vec2', 'uv')
    .attribute('vec4', 'joint')
    .attribute('vec4', 'weight')
    
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'modelViewMatrix')
    .uniform('vec4', `boneMatrix[${(2*MAX_BONES_PER_MESH)}]`)
    
    .varying('vec3', 'normalPass')
    .varying('vec2', 'uvPass')
    
    .function('mat4 DQtoMat(vec4 dqReal, vec4 dqDual)', [
        'float rx = dqReal.x, ry = dqReal.y, rz = dqReal.z, rw = dqReal.w;',
        'float tx = dqDual.x, ty = dqDual.y, tz = dqDual.z, tw = dqDual.w;',
        'float rxx = - (2.0 * rx * rx), ryy = - (2.0 * ry * ry), rzz = - (2.0 * rz * rz);',
        'float rxy = (2.0 * rx * ry), rxz = (2.0 * rx * rz), rxw = (2.0 * rx * rw);',
        'float ryz = (2.0 * ry * rz), ryw = (2.0 * ry * rw), rzw = (2.0 * rw * rz);',
        'return mat4(',
        '1.0 + ryy + rzz, rxy + rzw, rxz - ryw, 0,',
        'rxy - rzw, 1.0 + rxx + rzz, ryz + rxw, 0,',
        'rxz + ryw, ryz - rxw, 1.0 + rxx + ryy, 0,',
        '2.0 * (-tw * rx + tx * rw - ty * rz + tz * ry),',
        '2.0 * (-tw * ry + tx * rz + ty * rw - tz * rx),',
        '2.0 * (-tw * rz - tx * ry + ty * rx + tz * rw),',
        '1);',
    ])
    .function('mat4 calcJointTransform(void)', [
        'vec4 rQuats[4];',
        'vec4 tQuats[4];',
        'rQuats[0] = boneMatrix[int(joint.x * 2.0)];',
        'rQuats[1] = boneMatrix[int(joint.y * 2.0)];',
        'rQuats[2] = boneMatrix[int(joint.z * 2.0)];',
        'rQuats[3] = boneMatrix[int(joint.w * 2.0)];',
        'tQuats[0] = boneMatrix[int(joint.x * 2.0) + 1];',
        'tQuats[1] = boneMatrix[int(joint.y * 2.0) + 1];',
        'tQuats[2] = boneMatrix[int(joint.z * 2.0) + 1];',
        'tQuats[3] = boneMatrix[int(joint.w * 2.0) + 1];',
        //antipodality correction
        'if(dot(rQuats[0], rQuats[1]) < 0.0){ rQuats[1] *= -1.0; tQuats[1] *= -1.0; }',
        'if(dot(rQuats[0], rQuats[2]) < 0.0){ rQuats[2] *= -1.0; tQuats[2] *= -1.0; }',
        'if(dot(rQuats[0], rQuats[3]) < 0.0){ rQuats[3] *= -1.0; tQuats[3] *= -1.0; }',
        'vec4 weightedTQuat = weight.x * tQuats[0] + weight.y * tQuats[1] + weight.z * tQuats[2] + weight.w * tQuats[3];',
        'vec4 weightedRQuat = weight.x * rQuats[0] + weight.y * rQuats[1] + weight.z * rQuats[2] + weight.w * rQuats[3];',
        'float magnitude = length(weightedRQuat);',
        'weightedTQuat /= magnitude;',
        'weightedRQuat /= magnitude;',
        'return DQtoMat(weightedRQuat, weightedTQuat);'
    ])
    .main([
        'mat4 transformMatrix = modelViewMatrix * calcJointTransform();',
        'vec4 viewPosition = transformMatrix * vec4(position, 1.0);',
        'normalPass = vec3(transformMatrix * vec4(normal, 0.0));',
        'uvPass = uv;',
        'gl_Position = projectionMatrix * viewPosition;',
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'normalPass')
    .varying('vec2', 'uvPass')
    
    .uniform('sampler2D', 'albedo')
    .uniform('vec3', 'highlightColor')
    
    .main([
        'vec3 normal = normalize(normalPass);',
        'vec4 color = texture2D(albedo, uvPass);',
        'vec3 light = normalize(vec3(  0.5,  0.2,  1.0));',
        'float amount = max(dot(normalPass, light),  0.0);',
        'color = vec4(color.rgb * highlightColor, 1.0);',
        'gl_FragColor = color;'
    ])
}*/
const dualquat_skinning = {
    vert: vglsl.createShader()
    .attribute('vec4', 'joint')
    .attribute('vec4', 'weight')
    
    .uniform('vec4', `boneMatrix[${(2*MAX_BONES_PER_MESH)}]`)
    
    .function('mat4 DQtoMat(vec4 dqReal, vec4 dqDual)', [
        'float rx = dqReal.x, ry = dqReal.y, rz = dqReal.z, rw = dqReal.w;',
        'float tx = dqDual.x, ty = dqDual.y, tz = dqDual.z, tw = dqDual.w;',
        'float rxx = - (2.0 * rx * rx), ryy = - (2.0 * ry * ry), rzz = - (2.0 * rz * rz);',
        'float rxy = (2.0 * rx * ry), rxz = (2.0 * rx * rz), rxw = (2.0 * rx * rw);',
        'float ryz = (2.0 * ry * rz), ryw = (2.0 * ry * rw), rzw = (2.0 * rw * rz);',
        'return mat4(',
        '1.0 + ryy + rzz, rxy + rzw, rxz - ryw, 0,',
        'rxy - rzw, 1.0 + rxx + rzz, ryz + rxw, 0,',
        'rxz + ryw, ryz - rxw, 1.0 + rxx + ryy, 0,',
        '2.0 * (-tw * rx + tx * rw - ty * rz + tz * ry),',
        '2.0 * (-tw * ry + tx * rz + ty * rw - tz * rx),',
        '2.0 * (-tw * rz - tx * ry + ty * rx + tz * rw),',
        '1);',
    ])
    .function('mat4 calcJointTransform(void)', [
        'vec4 rQuats[4];',
        'vec4 tQuats[4];',
        'rQuats[0] = boneMatrix[int(joint.x * 2.0)];',
        'rQuats[1] = boneMatrix[int(joint.y * 2.0)];',
        'rQuats[2] = boneMatrix[int(joint.z * 2.0)];',
        'rQuats[3] = boneMatrix[int(joint.w * 2.0)];',
        'tQuats[0] = boneMatrix[int(joint.x * 2.0) + 1];',
        'tQuats[1] = boneMatrix[int(joint.y * 2.0) + 1];',
        'tQuats[2] = boneMatrix[int(joint.z * 2.0) + 1];',
        'tQuats[3] = boneMatrix[int(joint.w * 2.0) + 1];',
        //antipodality correction
        'if(dot(rQuats[0], rQuats[1]) < 0.0){ rQuats[1] *= -1.0; tQuats[1] *= -1.0; }',
        'if(dot(rQuats[0], rQuats[2]) < 0.0){ rQuats[2] *= -1.0; tQuats[2] *= -1.0; }',
        'if(dot(rQuats[0], rQuats[3]) < 0.0){ rQuats[3] *= -1.0; tQuats[3] *= -1.0; }',
        'vec4 weightedTQuat = weight.x * tQuats[0] + weight.y * tQuats[1] + weight.z * tQuats[2] + weight.w * tQuats[3];',
        'vec4 weightedRQuat = weight.x * rQuats[0] + weight.y * rQuats[1] + weight.z * rQuats[2] + weight.w * rQuats[3];',
        'float magnitude = length(weightedRQuat);',
        'weightedTQuat /= magnitude;',
        'weightedRQuat /= magnitude;',
        'return DQtoMat(weightedRQuat, weightedTQuat);'
    ])
}
export {dualquat_skinning}