import {CollisionDetector} from './collisionDetector'

import {sphereSphere} from './sphereSphere'
import {sphereBox} from './sphereBox'
import {boxBox} from './boxBox'
import {sphereConvex} from './sphereConvex'
import {convexConvex} from './convexConvex'
import {spherePlane} from './spherePlane'
import {planeConvex} from './planeConvex'

import {SHAPE_TYPE} from '../shape'

const detectors = Object.create(null)

detectors[SHAPE_TYPE.SPHERE] = sphereSphere
detectors[SHAPE_TYPE.BOX] = boxBox
detectors[SHAPE_TYPE.CONVEX] = convexConvex

detectors[SHAPE_TYPE.BOX | SHAPE_TYPE.CONVEX] = convexConvex
detectors[SHAPE_TYPE.SPHERE | SHAPE_TYPE.CONVEX] = sphereConvex
detectors[SHAPE_TYPE.SPHERE | SHAPE_TYPE.BOX] = sphereBox

detectors[SHAPE_TYPE.SPHERE | SHAPE_TYPE.PLANE] = spherePlane
detectors[SHAPE_TYPE.PLANE | SHAPE_TYPE.BOX] = planeConvex
detectors[SHAPE_TYPE.PLANE | SHAPE_TYPE.CONVEX] = planeConvex

const collisionDetector = CollisionDetector(detectors)

export {collisionDetector}