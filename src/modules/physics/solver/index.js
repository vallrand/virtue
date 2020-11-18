export * from './gaussSeidel'
export * from './islandSplit'

import {GaussSeidelSolver} from './gaussSeidel'

const DefaultSolver = _ => GaussSeidelSolver()

export {DefaultSolver}