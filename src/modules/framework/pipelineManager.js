import {factory} from '../util'
import {passes} from '../graphics'

factory.declare('application', target => {
    const GLContext = target.ctx,
          scene = target.scene
    
    GLContext.pipeline
    .pass(passes.SkyboxPass(GLContext, scene))
    .pass(passes.StaticGeometryPass(GLContext, scene, true))
    .pass(passes.SkinnedGeometryPass(GLContext, scene))
    .pass(passes.RealtimeLightingPass(GLContext, scene))
    .pass(passes.DecalGeometryPass(GLContext, scene, true))
    .pass(passes.LiquidSurfacePass(GLContext, scene))
    .pass(passes.ParticleEffectPass(GLContext, scene))
    //TODO dynamic pipeline management

    return {

    }
})