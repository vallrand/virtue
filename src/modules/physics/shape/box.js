import {vec3} from '../math/vec3'
import {ConvexPolyhedron} from './convex'

const Box = halfExtents => {
    const sx = halfExtents[0],
          sy = halfExtents[1],
          sz = halfExtents[2]
    const shape = Object.setPrototypeOf(ConvexPolyhedron([
        vec3(-sx,-sy,-sz),
        vec3( sx,-sy,-sz),
        vec3( sx, sy,-sz),
        vec3(-sx, sy,-sz),
        vec3(-sx,-sy, sz),
        vec3( sx,-sy, sz),
        vec3( sx, sy, sz),
        vec3(-sx, sy, sz)
    ],[[3,2,1,0], [4,5,6,7],
       [5,4,0,1], [2,3,7,6],
       [0,4,7,3], [1,2,6,5]
      ],[vec3.copy(vec3.AXIS_Z),
         vec3.copy(vec3.AXIS_Y),
         vec3.copy(vec3.AXIS_X)]
    ), Box.prototype)
    shape.halfExtents = halfExtents
    shape.boundingSphereRadius = vec3.distance(halfExtents) //TODO recalc on size change?
    return shape
}

Box.prototype = Object.setPrototypeOf({
    get volume(){ return 8.0 * this.halfExtents[0] * this.halfExtents[1] * this.halfExtents[2] },
    calculateLocalInertia: function(mass, out = vec3()){
        const halfSide = this.halfExtents,
              sx = halfSide[0] * halfSide[0],
              sy = halfSide[1] * halfSide[1],
              sz = halfSide[2] * halfSide[2],
              sm = mass * 1.0 / 3.0
        out[0] = sm * (sy + sz)
        out[1] = sm * (sx + sz)
        out[2] = sm * (sx + sy)
        return out
    },
    calculateWorldAABB: function(position, rotation, min, max){
        const halfSide = this.halfExtents,
              temp = vec3.temp
        vec3.copy(vec3.MAX, min)
        vec3.copy(vec3.MIN, max)
        
        for(let i = 0; i < 8; i++){
            vec3.set(i & 0x01 ? halfSide[0] : -halfSide[0],
                     i & 0x02 ? halfSide[1] : -halfSide[1],
                     i & 0x04 ? halfSide[2] : -halfSide[2], temp)
            vec3.transformQuat(temp, rotation, temp)
            vec3.add(temp, position, temp)
            vec3.min(min, temp, min)
            vec3.max(max, temp, max)
        }
    }
}, ConvexPolyhedron.prototype)

export {Box}