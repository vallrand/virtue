import {vec3} from '../math/vec3'

const spherePlane = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context
    
    vec3.transformQuat(vec3.AXIS_Z, worldRotationB, contactNormal)
    vec3.negate(contactNormal, contactNormal)
    vec3.normalize(contactNormal, contactNormal)
    
    const planeToSphere = vec3.subtract(worldPositionA, worldPositionB, context.vec3Pool.obtain())
    
    if(-vec3.dot(planeToSphere, contactNormal) > shapeA.radius) return false
    if(bailEarly) return true
    
    vec3.scale(contactNormal, shapeA.radius, contactPointA)
    
    vec3.scale(contactNormal, vec3.dot(contactNormal, planeToSphere), contactPointB)
    vec3.subtract(planeToSphere, contactPointB, contactPointB)
    
    vec3.add(contactPointA, worldPositionA, contactPointA)
    vec3.add(contactPointB, worldPositionB, contactPointB)
    
    context.registerContact()
    return true
}

export {spherePlane}