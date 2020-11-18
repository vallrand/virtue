import {vec3, AABB} from '../math'
import {materialLibrary} from '../foundation'

const PairsArray = (array = []) => ({
    add: (a, b) => array.push([a, b]),
    next: _ => array.pop()
})

const checkCollisionFlags = (bodyA, bodyB) => {
    if(!bodyA.dynamic && !bodyB.dynamic) return false
    const material = materialLibrary.getContactMaterial(bodyA.material, bodyB.material)
    //if(!material.collisionResponse) return false //TODO add propery for removing collisions entirely
    
    const jointIterationCost = bodyA.joints.length < bodyB.joints.length,
          joints = jointIterationCost ? bodyA.joints : bodyB.joints
    if(!jointIterationCost) bodyB = bodyA
    for(let i = joints.length - 1; i >= 0; i--){
        let joint = joints[i]
        if(joint.collisionResponse) continue
        if(joint.bodyA === bodyB || joint.bodyB === bodyB)
            return false
    }
    return true
}

const testAABBCollision = (bodyA, bodyB) => {
    const aabbA = bodyA.aabb,
          aabbB = bodyB.aabb
    return AABB.overlap(aabbA, aabbB)
}

const testBoundingSphereCollision = (bodyA, bodyB) => {
    const combinedRadius = bodyA.boundingSphereRadius + bodyB.boundingSphereRadius
    return vec3.differenceSquared(bodyA.position, bodyB.position) < combinedRadius * combinedRadius
}

export {PairsArray, checkCollisionFlags, testAABBCollision, testBoundingSphereCollision}