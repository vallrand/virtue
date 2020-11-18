import {vec3} from '../math/vec3'

const sphereBox = (context, shapeA, shapeB, worldPositionA, worldPositionB, worldRotationA, worldRotationB, bailEarly) => {
    const { contactNormal, contactPointA, contactPointB } = context,
          vec3Pool = context.vec3Pool,
          radius = shapeA.radius,
          halfExtents = shapeB.halfExtents,
          boxToSphere = vec3.subtract(worldPositionA, worldPositionB, vec3Pool.obtain())

    const axisX = vec3.transformQuat(vec3.AXIS_X, worldRotationB, vec3Pool.obtain()),
          axisY = vec3.transformQuat(vec3.AXIS_Y, worldRotationB, vec3Pool.obtain()),
          axisZ = vec3.transformQuat(vec3.AXIS_Z, worldRotationB, vec3Pool.obtain()),
          dotX = vec3.dot(boxToSphere, axisX),
          dotY = vec3.dot(boxToSphere, axisY),
          dotZ = vec3.dot(boxToSphere, axisZ),
          side = vec3.set(dotX < 0 ? -halfExtents[0] : halfExtents[0],
                          dotY < 0 ? -halfExtents[1] : halfExtents[1],
                          dotZ < 0 ? -halfExtents[2] : halfExtents[2], vec3Pool.obtain()),
          sideX = dotX < 0 ? -halfExtents[0] : halfExtents[0],
          sideY = dotY < 0 ? -halfExtents[1] : halfExtents[1],
          sideZ = dotZ < 0 ? -halfExtents[2] : halfExtents[2],
          overlapX = halfExtents[0] - Math.abs(dotX),
          overlapY = halfExtents[1] - Math.abs(dotY),
          overlapZ = halfExtents[2] - Math.abs(dotZ),
          minOverlap = Math.min(overlapX, overlapY, overlapZ)
    
    if(overlapX > 0 && overlapX != minOverlap) side[0] = dotX
    if(overlapY > 0 && overlapY != minOverlap) side[1] = dotY
    if(overlapZ > 0 && overlapZ != minOverlap) side[2] = dotZ
    
    vec3.set(axisX[0] * side[0] + axisY[0] * side[1] + axisZ[0] * side[2],
             axisX[1] * side[0] + axisY[1] * side[1] + axisZ[1] * side[2],
             axisX[2] * side[0] + axisY[2] * side[1] + axisZ[2] * side[2], contactPointB)
    vec3.subtract(contactPointB, boxToSphere, contactNormal)
    
    if(vec3.distanceSquared(contactNormal) >= radius * radius && minOverlap <= 0) return false
    if(bailEarly) return true
    
    if(minOverlap > 0) vec3.negate(contactNormal, contactNormal)
    vec3.normalize(contactNormal, contactNormal)
    vec3.scale(contactNormal, radius, contactPointA)

    vec3.add(contactPointA, worldPositionA, contactPointA)
    vec3.add(contactPointB, worldPositionB, contactPointB)
    context.registerContact()
    return true
}

export {sphereBox}