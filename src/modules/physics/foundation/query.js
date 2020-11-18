import {tie, factory} from '../../util'
import {Ray, Raytracer, rayConvex, raySphere, rayPlane, rayBox} from '../math'
import {SHAPE_TYPE} from '../shape'

factory.declare('physics', (target, options) => {
    return {
        raycast: Raytracer(target, {
            [SHAPE_TYPE.SPHERE]: raySphere,
            [SHAPE_TYPE.CONVEX]: rayConvex,
            [SHAPE_TYPE.PLANE]: rayPlane,
            [SHAPE_TYPE.BOX]: rayBox
        })
    }
})