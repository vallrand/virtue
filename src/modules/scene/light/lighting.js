import {factory, tie, Signal, Stream} from '../../util'
import {vec3, vec4, mat4} from '../../math'

factory.declare('scene', (target, options) => {
    const lights = [],
          queryShadowcasters = _ => target.fetchInstancesByGroup('static').filter(mesh => mesh.loaded).map(mesh => mesh.instances).flatten()
    //TODO add bounding sphere parameter for faster look up
    
	return {
        lights,
        createLight: options => {
            let light = tie(factory.build(options.type, options), { type: options.type, queryShadowcasters })
            light.onCleanup(lights.remove.bind(lights, light))
            lights.push(light)
            target.dispatchEvent('light', light)
            return light
        }
	}
})