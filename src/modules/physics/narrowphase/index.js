export * from './narrowphase'

import {collisionDetector} from '../collision'
import {Narrowphase} from './narrowphase'

const DefaultNarrowphase = _ => Narrowphase(collisionDetector)

export {DefaultNarrowphase}