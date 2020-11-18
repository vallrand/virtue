import {PairsArray} from './broadphase'
import {AABB} from '../math/aabb'

const insertionSort = (array, comparator) => {
    for(let length = array.length, i = 1; i < length; i++){
        let j, item = array[i]
        for(j = i - 1; j >= 0; j--){
            if(comparator(array[j], item) >= 0) break
            array[j + 1] = array[j]
        }
        array[j + 1] = item
    }
    return array
}

const SimpleSAPBroadphase = ({checkCollisionFlags, testCollision}) => {
    const bodies = []
    
    const checkBounds = (bodyA, bodyB, axisIndex) => bodyB.aabb.lowerBound[axisIndex] < bodyA.aabb.upperBound[axisIndex]
    
    const sortList = (list, axisIndex) => insertionSort(list, (a, b) => b.aabb.lowerBound[axisIndex] - a.aabb.lowerBound[axisIndex])
    
    let axisIndex = 0
    
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
            sortList(bodies, axisIndex)
            
            for(let length = bodies.length, a = 0; a < length; a++)
            for(let b = a + 1, bodyA = bodies[a]; b < length; b++){
                let bodyB = bodies[b]
                if(!checkBounds(bodyA, bodyB, axisIndex)) break
                if(!checkCollisionFlags(bodyA, bodyB)) continue
                if(testCollision(bodyA, bodyB)) pairs.add(bodyA, bodyB)
            }
            return pairs
        },
        aabbQuery: (aabb, out = []) => {
            sortList(bodies, axisIndex) //TODO don't sort all the time

            const lower = aabb.lowerBound[axisIndex],
                  upper = aabb.upperBound[axisIndex]
            for(let length = bodies.length, i = 0; i < length; i++){
                let body = bodies[i]
                //TODO break and check axis bounds
                if(AABB.overlap(body.aabb, aabb))
                    result.push(body)
            }
            return out
        },
        autoDetectAxis: _ => {
            let totalX = 0, totalSquaredX = 0,
                totalY = 0, totalSquaredY = 0,
                totalZ = 0, totalSquaredZ = 0
            for(let i = bodies.length - 1; i >= 0; i--){
                let body = bodies[i],
                    positionX = body.position[0],
                    positionY = body.position[1],
                    positionZ = body.position[2]
                totalX += positionX
                totalY += positionY
                totalZ += positionZ
                totalSquaredX += positionX * positionX
                totalSquaredY += positionY * positionY
                totalSquaredZ += positionZ * positionZ
            }
            const invLength = 1.0 / bodies.length,
                  varianceX = totalSquaredX - totalX * totalX * invLength,
                  varianceY = totalSquaredY - totalY * totalY * invLength,
                  varianceZ = totalSquaredZ - totalZ * totalZ * invLength,
                  varianceMax = Math.max(varianceX, varianceY, varianceZ)
            if(varianceX == varianceMax) return axisIndex = 0
            if(varianceY == varianceMax) return axisIndex = 1
            if(varianceZ == varianceMax) return axisIndex = 2
        }
    }
}

export {SimpleSAPBroadphase}