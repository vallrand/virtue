import { vec3, vec4, mat4, dualquat, quat } from '../../modules/math'
import { deserialize, ConeTwistConstraint, LockConstraint, Transform } from '../../modules/physics'

    //0 body
    //1 pelvis
    //2 chest
    //3 upper right leg
    //4 upper left leg
    //5 lower left leg
    //6 lower right legt
    //7 right shoulder
    //8 left shoulder
    //9 head
    //10 right arm
    //11 left foot
    //12 left arm
    //13 right foot
    //14 right hand
    //15 left hand
export function buildRagdoll(app, target, bones){
    const boneOrigins = bones.map(bone => vec4.transform(vec3.ZERO, bone.bindPose, vec3()))
    const boneWidth = 0.4
    
    function boneFromTo(origin, target){
        const center = vec3.add(origin, target, vec3())
        vec3.scale(center, 0.5, center)
        
        const difference = vec3.subtract(target, origin, vec3())
        const angle = Math.atan2(difference[1], difference[0])
        
        return {
            position: center,
            quaternion: quat.setAxisAngle(vec3.AXIS_Z, 0.5 * Math.PI + angle),
            shapes: [{
                type: 'box', halfExtents: [0.5 * boneWidth, 0.5 * vec3.distance(difference), 0.5 * boneWidth]
            }]
        }
    }
    
    const worldTransform = target.modelMatrix
    const worldOrientation = quat.fromMat4(worldTransform, quat())
    const imposters = deserialize([
    Object.assign({
        name: 'lower left leg',
        boneIndex: 11,
        mass: 1
    }, boneFromTo(boneOrigins[5], boneOrigins[11])),
    Object.assign({
        name: 'lower right leg',
        boneIndex: 13,
        mass: 1
    }, boneFromTo(boneOrigins[6], boneOrigins[13])),
    Object.assign({
        name: 'upper left leg',
        boneIndex: 5,
        mass: 1,
    }, boneFromTo(boneOrigins[4], boneOrigins[5])),
    Object.assign({
        name: 'upper right leg',
        boneIndex: 6,
        mass: 1,
    }, boneFromTo(boneOrigins[3], boneOrigins[6])),
    {
        name: 'pelvis',
        boneIndex: 1,
        mass: 1,
        position: boneOrigins[1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.3, 0.3, 0.2] }]
    }, {
        name: 'upper body',
        boneIndex: 2,
        mass: 1,
        position: boneOrigins[2],
        quaternion: quat.setAxisAngle(vec3.AXIS_X, Math.PI),
        shapes: [{ type: 'box', halfExtents: [0.3, 0.3, 0.2] }]
    }, {
        name: 'head',
        boneIndex: 9,
        mass: 1,
        position: vec3.add(boneOrigins[9], [0, 0.4, 0]),
        quaternion: quat.setAxisAngle(vec3.AXIS_X, Math.PI),
        shapes: [{ type: 'box', halfExtents: [0.4,0.4,0.4] }]
    },
    Object.assign({
        name: 'upper left arm',
        boneIndex: 12,
        mass: 1
    }, boneFromTo(boneOrigins[8], boneOrigins[12])),
    Object.assign({
        name: 'upper right arm',
        boneIndex: 10,
        mass: 1
    }, boneFromTo(boneOrigins[7], boneOrigins[10])),
    Object.assign({
        name: 'lower left arm',
        boneIndex: 15,
        mass: 1
    }, boneFromTo(boneOrigins[12], boneOrigins[15])),
    Object.assign({
        name: 'lower right arm',
        boneIndex: 14,
        mass: 1
    }, boneFromTo(boneOrigins[10], boneOrigins[14]))
    ].map(function(body){
        body.bindPose = mat4.fromRotationTranslationScale(body.quaternion, body.position, vec3.ONE, mat4())
        body.invBindPose = mat4.invert(body.bindPose, mat4())
        
        vec4.transform(body.position, worldTransform, body.position)
        quat.multiply(worldOrientation, body.quaternion, body.quaternion)
        quat.normalize(body.quaternion, body.quaternion)
        return Object.assign(body, {
            material: 'ragdollMaterial'
        })
    }))
    .map(body => app.physics.addBody(body))
    
    const imposterMap = Object.create(null)
    imposters.forEach(imposter => imposterMap[imposter.boneIndex + 1] = imposter)
    
    function linkBodies(imposter, parentImposter, axis){
        const boneHalfLength = imposter.shapes[0].halfExtents[1]
        const jointPivot = vec3(0, boneHalfLength, 0)
        const jointAxis = vec3(0, 1, 0)
        
        const parentJointPivot = vec3.copy(jointPivot, vec3())
        const parentJointAxis = vec3.copy(jointAxis, vec3())
        
        Transform.pointToWorldFrame(parentJointPivot, imposter.position, imposter.quaternion, parentJointPivot)
        Transform.pointToLocalFrame(parentJointPivot, parentImposter.position, parentImposter.quaternion, parentJointPivot)
        
        Transform.vectorToWorldFrame(parentJointAxis, imposter.position, imposter.quaternion, parentJointAxis)
        Transform.vectorToLocalFrame(parentJointAxis, parentImposter.position, parentImposter.quaternion, parentJointAxis)
        
        return ConeTwistConstraint(imposter, parentImposter, {
            pivotA: jointPivot,
            pivotB: parentJointPivot,
            axisA: jointAxis,
            axisB: parentJointAxis,
            angle: 0.24 * Math.PI,
            twistAngle: 0 * Math.PI
        })
    }
    
    function traverseBoneHierarchy(bones, boneId, callback){
        let bone = bones[boneId - 1]
        while(bone){
            let output = callback(bone)
            if(output) return output
            bone = bones[bone.parent - 1]
        }
    }
    
    const constraints = imposters.map(imposter => {
        const { boneIndex } = imposter
        const parentImposter = traverseBoneHierarchy(bones, boneIndex + 1, (
            bone => bone.id != boneIndex + 1 && imposterMap[bone.id]
        ))
        if(!parentImposter) return
        return linkBodies(imposter, parentImposter)
    }).filter(constraint => constraint)
    .map(constraint => app.physics.addConstraint(constraint))
    
    return {
        get position(){ return imposters[4].position },
        imposters,
        constraints,
        imposterMap,
        delete(){
            constraints.forEach(constraint => app.physics.removeConstraint(constraint))
            imposters.forEach(imposter => app.physics.removeBody(imposter))
        }
    }
} 