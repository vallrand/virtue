import {setupParticleEffects} from './particleEffects'
import {setupPhysics} from './physics'

const setupConfiguration = app => {
    setupPhysics(app)
    setupParticleEffects(app)
}

export {setupConfiguration}