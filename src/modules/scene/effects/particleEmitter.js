import {factory, tie, Signal, Stream} from '../../util'
import {vec3, vec4, mat4} from '../../math'
import {Observable, Instance} from '../instance'

factory.declare('scene', (target, options) => {
    const resourceManager = options.manager,
          particleEmitters = Object.create(null)
    
    target.addEventListener('update', deltaTime => {
        deltaTime = Math.min(1e3/60, 0.001 * deltaTime)
        Object.values(particleEmitters).forEach(emitter => {
            emitter.instances.forEach(instance => instance.advanceTime(deltaTime))
            emitter.delegate && emitter.delegate.advanceTime(deltaTime)
        })
    })
    
	return {
        defineParticleSystem: options => {
            particleEmitters[options.name] = tie(options, {
                instances: [],
                texture: typeof options.texture === 'string' ? resourceManager.requestResource(options.texture) : options.texture,
                //TODO how to specify one of defaults?
                //TODO clear
            })
            return target
        },
        createParticleEmitter: options => {
            const particleSystem = particleEmitters[options.type]
            if(!particleSystem) throw new Error(`Particle System "${options.type}" not defined.`)
            const instance = factory.build('particle_emitter', Object.assign({ emitter: particleSystem }, options))
            particleSystem.instances.push(instance)
            target.dispatchEvent('particle_emitter', instance, particleSystem)
            instance.onCleanup(particleSystem.instances.remove.bind(particleSystem.instances, instance)) //TODO resource release(textures etc)?
            return instance
        }
	}
})

factory.declare('particle_emitter', Observable)
factory.declare('particle_emitter', Instance)
factory.declare('particle_emitter', (target, options) => { //TODO pass delegate, put more control into this class
    
    
    return {
        time: options.timeOffset || 0,
        frequency: options.emitter.frequency || 0,
        visible: true,
        get boundingSphereRadius(){ return options.emitter.delegate ? options.emitter.delegate.radius : 0 },
        advanceTime: options.emitter.static ?
        deltaTime => target.time += deltaTime :
        deltaTime => {
            target.time += deltaTime
            let amountToSpawn = target.frequency && Math.floor(target.time / target.frequency)
            if(amountToSpawn <= 0 || !options.emitter.delegate) return false
            target.time -= amountToSpawn * target.frequency
            options.emitter.delegate.emitParticles(amountToSpawn, target.modelMatrix)
        },
        trigger: _ => {
            //TODO loop once and then set visible to false
        }
    }
})