import { factory, tie, Signal, Stream } from '../../util'
import { vec3, vec4, mat4 } from '../../math'
import { Observable, Instance } from '../instance'

factory.declare('scene', (target, options) => {
    const resourceManager = options.manager
    const surfaces = []
    
    target.addEventListener('update', deltaTime => {
        deltaTime *= 1e-3
        for(let i = surfaces.length - 1; i >= 0; i--)
            surfaces[i].advanceTime(deltaTime)
    })
    
	return {
        surfaces,
        createLiquidSurface: options => {
            const instance = factory.build('liquid_surface', options)
            surfaces.push(instance)
            target.dispatchEvent('liquid_surface', instance)
            instance.onCleanup(surfaces.remove.bind(surfaces, instance))
            return instance
        }
	}
})

factory.declare('liquid_surface', Observable)
factory.declare('liquid_surface', Instance)
factory.declare('liquid_surface', (target, options) => {
    
    return {
        frequency: 0.16,
        choppiness: 4,
        height: 1,
        color: vec3.copy(options.color || vec3.ZERO),
        time: options.timeOffset || 0,
        visible: true,
        get boundingSphereRadius(){ return 100 * Math.max(...target.scale) },
        advanceTime: deltaTime => target.time += deltaTime
    }
})