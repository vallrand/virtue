import {vec3} from '../math/vec3'

const UniformGridBroadphase = ({checkCollisionFlags, testCollision}) => {
    const dimensions = vec3.copy([10, 10, 10]), //TODO options
          aabbMin = vec3.copy([100, 100, 100]),
          aabbMax = vec3.copy([-100,-100,-100])
    let binCount = dimensions[0] * dimensions[1] * dimensions[2]
    const bins = Array(binCount).fill().map(_ => []),
          binSizes = Array(binCount).fill(0),
          bodies = []
    
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
            let stepX = dimensions[1] * dimensions[2],
                stepY = dimensions[2],
                stepZ = 1
            let binSizeX = (aabbMax[0] - aabbMin[0]) / dimensions[0],
                binSizeY = (aabbMax[1] - aabbMin[1]) / dimensions[1],
                binSizeZ = (aabbMax[2] - aabbMin[2]) / dimensions[2],
                binRadius = Math.sqrt(binSizeX*binSizeX + binSizeY*binSizeY + binSizeZ*binSizeZ) * 0.5
            for(let i = binSizes.length - 1; i >= 0; binSizes[i--] = 0); //TODO use fill?
            
            let xmult = 1/binSizeX, ymult = 1/binSizeY, zmult = 1/binSizeZ
            
            const insertBox = (x0,y0,z0,x1,y1,z1, body) => {
                let xoff0 = ((x0 - aabbMin[0]) * xmult) | 0,
                    yoff0 = ((y0 - aabbMin[1]) * ymult) | 0,
                    zoff0 = ((z0 - aabbMin[2]) * zmult) | 0,
                    xoff1 = Math.ceil((x1 - aabbMin[0]) * xmult),
                    yoff1 = Math.ceil((y1 - aabbMin[1]) * ymult),
                    zoff1 = Math.ceil((z1 - aabbMin[2]) * zmult)
                
                xoff0 = Math.clamp(xoff0, 0, dimensions[0] - 1)
                yoff0 = Math.clamp(yoff0, 0, dimensions[1] - 1)
                zoff0 = Math.clamp(zoff0, 0, dimensions[2] - 1)
                xoff1 = Math.clamp(xoff1, 0, dimensions[0] - 1)
                yoff1 = Math.clamp(yoff1, 0, dimensions[1] - 1)
                zoff1 = Math.clamp(zoff1, 0, dimensions[2] - 1)
                xoff0 *= stepX
                yoff0 *= stepY
                zoff0 *= stepZ
                xoff1 *= stepX
                yoff1 *= stepY
                zoff1 *= stepZ

                for(let xoff = xoff0; xoff <= xoff1; xoff += stepX)
                    for(let yoff = yoff0; yoff <= yoff1; yoff += stepY)
                        for(let zoff = zoff0; zoff <= zoff1; zoff += stepZ){
                            let idx = xoff+yoff+zoff
                            bins[idx][binSizes[idx]++] = body
                        }
            }
            
            
            for(let i = 0; i < bodies.length; i++){
                let body = bodies[i]
                if(body.aabbNeedsUpdate) body.computeAABB()
                insertBox(body.aabb.lowerBound[0],
                          body.aabb.lowerBound[1],
                          body.aabb.lowerBound[2],
                          body.aabb.upperBound[0],
                          body.aabb.upperBound[1],
                          body.aabb.upperBound[2], body)
            }
            
            let pairUniqueMap = Object.create(null)
            for(let i = 0; i < bins.length; i++){
                let length = binSizes[i]
                if(length <= 1) continue
                let bin = bins[i]
                for(let a = 0; a < length; a++)
                    for(let bodyA = bin[a], b = 0; b < a; b++){
                        let bodyB = bin[b]
                        let key = bodyA.id < bodyB.id ? bodyA.id+'-'+bodyB.id : bodyB.id+'-'+bodyA.id
                        if(pairUniqueMap[key]) continue
                        pairUniqueMap[key] = true
                        if(!checkCollisionFlags(bodyA, bodyB)) continue
                        if(testCollision(bodyA, bodyB)) pairs.add(bodyA, bodyB)
                    }
                
            }
            
            return pairs
        }
    }
}

export {UniformGridBroadphase}