import {vglsl} from '../vglsl'
import {MAX_BONES_PER_MESH} from '../../glutil'

const linear_skinning = {
    vert: vglsl.createShader()
    .attribute('vec4', 'joint')
    .attribute('vec4', 'weight')
    
    //.uniform('mat4', `boneMatrix[${MAX_BONES_PER_MESH}]`)
    .uniform('vec4', `boneMatrix[${(3*MAX_BONES_PER_MESH)}]`)
    
    
    .function('mat4 getBoneMat(int jointIdx)', [
        'vec4 col0 = boneMatrix[jointIdx*3+0];',
        'vec4 col1 = boneMatrix[jointIdx*3+1];',
        'vec4 col2 = boneMatrix[jointIdx*3+2];',
        'return mat4(col0[0], col1[0], col2[0], 0.0,',
                    'col0[1], col1[1], col2[1], 0.0,',
                    'col0[2], col1[2], col2[2], 0.0,',
                    'col0[3], col1[3], col2[3], 1.0);'
    ])
    
    .function('mat4 calcJointTransform(void)', [
        'return weight.x * getBoneMat(int(joint.x))',
            '+ weight.y * getBoneMat(int(joint.y))',
            '+ weight.z * getBoneMat(int(joint.z))',
            '+ weight.w * getBoneMat(int(joint.w));'
    ])
}
export {linear_skinning}