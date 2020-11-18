export * from './vec3'
export * from './vec2'
export * from './mat3'
export * from './quat'
export * from './transform'
export * from './ray'
export * from './separatingAxis'
export * from './aabb'

import {vec3} from './vec3'
import {vec2} from './vec2'
import {Pool, PoolManager} from '../../util'

const aquireVec3Pool = PoolManager(Pool(_ => vec3()))
const aquireVec2Pool = PoolManager(Pool(_ => vec2()))

export {aquireVec3Pool, aquireVec2Pool}