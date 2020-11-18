import { PairsArray } from './broadphase'
import { AABB } from '../math/aabb'

export const BruteForceBroadphase = ({ checkCollisionFlags, testCollision }) => {
    const bodies = []
    
    return {
        add: body => {
            if(bodies.indexOf(body) !== -1) return false
            bodies.push(body)
        },
        remove: body => {
            const index = bodies.indexOf(body)
            if(index === -1) return false
            bodies.splice(index, 1)
        },
        queryCandidates: (pairs = PairsArray()) => {
            for(let a = bodies.length - 1; a > 0; a--)
            for(let b = a - 1, bodyA = bodies[a]; b >= 0; b--){
                let bodyB = bodies[b]
                if(!checkCollisionFlags(bodyA, bodyB)) continue
                if(testCollision(bodyA, bodyB)) pairs.add(bodyA, bodyB)
            }
            return pairs
        },
        aabbQuery: (aabb, out = []) => {
            for(let i = bodies.length - 1; i >= 0; i--)
                if(AABB.overlap(bodies[i].aabb, aabb))
                    out.push(bodies[i])
            return out
        }
    }
}