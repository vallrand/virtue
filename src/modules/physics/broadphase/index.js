export * from './broadphase'
export * from './bruteForce'
export * from './simpleSAP'
export * from './sweepAndPrune'
export * from './uniformGrid'
export * from './boundingVolumeTree'

import {BruteForceBroadphase} from './bruteForce'
import {checkCollisionFlags, testBoundingSphereCollision} from './broadphase'

const DefaultBroadphase = _ => BruteForceBroadphase({checkCollisionFlags: checkCollisionFlags, testCollision: testBoundingSphereCollision})

export {DefaultBroadphase}