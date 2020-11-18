import {vec3} from '../math/vec3'
import {quat} from '../math/quat'
import {aquireVec3Pool} from '../math'

const CollisionDetector = detectors => ({
    test: (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
        context.vec3Pool = aquireVec3Pool()
        context.flip = shapeA.type >= shapeB.type
        
        const detector = detectors[shapeA.type | shapeB.type],
              result = !context.flip ? 
                detector(context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) :
                detector(context, shapeB, shapeA, worldPositionB, worldPositionA, worldRotationB, worldRotationA, bailEarly)
        context.vec3Pool.release()
        return result
    }
})

export {CollisionDetector}