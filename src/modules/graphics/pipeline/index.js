export * from './pipeline'
export * from './lightmapper'
export * from './shadowmapper'
export * from './filter'

import {SkyboxPass} from './skyboxPass'
import {StaticGeometryPass} from './staticGeometryPass'
import {RealtimeLightingPass} from './realtimeLightingPass'
import {SkinnedGeometryPass} from './skinnedGeometryPass'
import {DecalGeometryPass} from './decalGeometryPass'
import {ParticleEffectPass} from './particleEffectPass'
import {LiquidSurfacePass} from './liquidSurfacePass'
//import {PostEffectPass} from './postEffectPass'

export const passes = {
    SkyboxPass,
    StaticGeometryPass,
    RealtimeLightingPass,
    SkinnedGeometryPass,
    DecalGeometryPass,
    ParticleEffectPass,
    LiquidSurfacePass
    //PostEffectPass,
}