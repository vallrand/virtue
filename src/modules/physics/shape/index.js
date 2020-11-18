export * from './cylinder'

import {Sphere} from './sphere'
import {Plane} from './plane'
import {ConvexPolyhedron} from './convex'
import {Box} from './box'

const SHAPE_TYPE = {
    SPHERE: 1,
    PLANE: 2,
    CONVEX: 16,
    BOX: 4
}

Sphere.prototype.type = SHAPE_TYPE.SPHERE
Plane.prototype.type = SHAPE_TYPE.PLANE
ConvexPolyhedron.prototype.type = SHAPE_TYPE.CONVEX
Box.prototype.type = SHAPE_TYPE.BOX

export {Sphere, Plane, ConvexPolyhedron, Box, SHAPE_TYPE}