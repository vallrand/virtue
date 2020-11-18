import {factory, tie, Stream, snapshot} from '../../util'
import {mat3, mat4, vec3, vec4, quat, dualquat} from '../../math'

factory.declare('armature', (target, options) => {
    options.dualQuatSkinning = true
    
    const DQS = options.dualQuatSkinning,
          TRANSFORM_MATRIX_SIZE = !DQS ? 4 * 3 : 8,
          bones = snapshot(options.bones.slice(1)),
          animation = options.animation && factory.build('animation', {layers: options.animation, dualQuatSkinning: DQS}),
          transformArray = new Float32Array(bones.length * TRANSFORM_MATRIX_SIZE),
          transform = [],
          worldTransform = [],
          tempMat = mat4()
    bones.forEach((bone, offsetId) => {
        Object.assign(bone, {id: offsetId + 1, invBindPose: mat4.invert(bone.bindPose)})
        transform[bone.id] = new Float32Array(transformArray.buffer, Float32Array.BYTES_PER_ELEMENT * TRANSFORM_MATRIX_SIZE * offsetId, TRANSFORM_MATRIX_SIZE)
        mat4.copy(mat4.identity(), transform[bone.id])
        if(DQS){
            bone.localTransform = dualquat.fromMat4(bone.localTransform)
            bone.invBindPose = dualquat.fromMat4(bone.invBindPose)
            worldTransform[bone.id] = dualquat()
        }else{
            worldTransform[bone.id] = mat4.identity()
        }
    })
    return {
        get bones(){ return bones },
        get animation(){ return animation },
        get worldTransform(){ return worldTransform },
        get transform(){ return transform },
        update: !DQS ? mixer => {
            bones.forEach(bone => {
                const boneId = bone.id,
                      parentBoneId = bone.parent,
                      frameTransform = animation.sample(boneId, mixer) || bone.localTransform
                      
                mat4.copy(frameTransform, worldTransform[boneId])
                
                if(parentBoneId > 0)
                    mat4.multiply(worldTransform[parentBoneId], worldTransform[boneId], worldTransform[boneId])
                
                mat4.transpose(mat4.multiply(worldTransform[boneId], bone.invBindPose, tempMat), transform[boneId])
                //For matrices *16 transpose can be omitted.
                //mat4.multiply(worldTransform[boneId], bone.invBindPose, transform[boneId])
            })
        } : mixer => {
            bones.forEach(bone => {
                const boneId = bone.id,
                      parentBoneId = bone.parent,
                      frameTransform = animation.sample(boneId, mixer) || bone.localTransform
                      
                dualquat.copy(frameTransform, worldTransform[boneId])
                
                if(parentBoneId > 0)
                    dualquat.multiply(worldTransform[parentBoneId], worldTransform[boneId], worldTransform[boneId])
                
                dualquat.multiply(worldTransform[boneId], bone.invBindPose, transform[boneId])
            })
        },
        get jointMatrixArray(){ return transformArray }
    }
})