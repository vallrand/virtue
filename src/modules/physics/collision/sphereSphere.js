import {vec3} from '../math/vec3'

const sphereSphere = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context
    const minDistance = shapeA.radius + shapeB.radius
    vec3.subtract(worldPositionB, worldPositionA, contactNormal)
    
    if(vec3.distanceSquared(contactNormal) >= minDistance * minDistance) return false
    if(bailEarly) return true
    
    vec3.normalize(contactNormal, contactNormal)
    
    vec3.scale(contactNormal, shapeA.radius, contactPointA)
    vec3.scale(contactNormal, -shapeB.radius, contactPointB)
    
    vec3.add(contactPointA, worldPositionA, contactPointA)
    vec3.add(contactPointB, worldPositionB, contactPointB)
    
    context.registerContact()
    return true
}

export {sphereSphere}