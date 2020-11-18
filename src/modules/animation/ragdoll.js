import { factory } from '../util'
import {mat3, mat4, vec3, vec4, quat, dualquat} from '../math'

const defaultTransform = mat4.identity()
const tempTransform = mat4()

factory.declare('instance', (target, options) => {
    if(options.group !== 'skinned') return null
    
    let boundRagdoll = null
    target.onCleanup(function(){
        if(boundRagdoll) boundRagdoll.delete()
        boundRagdoll = false
    })
    function findImposter(bones, bone){
        while(bone){
            let imposter = boundRagdoll.imposterMap[bone.id]
            if(imposter) return imposter
            bone = bones[bone.parent - 1]
        }
    }
    
    return {
        bindRagdoll(builder){
            target.delegate.loadEvent.listen(function(){
                if(boundRagdoll !== null) return
                const data = target.delegate.data
                const bones = data.armature.bones

                boundRagdoll = builder(bones)
            })
        },
        update: (deltaTime => {
            if(boundRagdoll && target.ragdollEnabled){
                target.position = boundRagdoll.position
                if(target.parent) vec4.transform(target.position, mat4.invert(target.parent.modelMatrix), target.position)
            }
        }).extend(target.update),
        applyTransform: armature => {
            if(!boundRagdoll || !target.ragdollEnabled) return
            const invModelMatrix = mat4.invert(target.modelMatrix)
            
            //TODO only works for DQS
            for(let i = armature.bones.length - 1; i >= 0; i--){
                let bone = armature.bones[i]
                const boneId = bone.id
                let frameTransform = defaultTransform
                
                const imposter = findImposter(armature.bones, bone)
                if(imposter){
                    const localTransform = mat4.fromRotationTranslationScale(imposter.quaternion, imposter.position, vec3.ONE, tempTransform)
                    mat4.multiply(invModelMatrix, localTransform, localTransform)
                    mat4.multiply(localTransform, imposter.invBindPose, localTransform)
                    frameTransform = localTransform
                }

                dualquat.fromMat4(frameTransform, armature.transform[boneId])
            }
        }
    }
})