import {factory, Stream} from '../../util'
import {vec3, vec4} from '../../math'

//TODO refactor to interpolate between zones and use zone settings
factory.declare('scene', (target, options) => {
    let fogDensity = options.fogDensity || 0.00016
    const fogColor = vec3.copy(options.fogColor || [1.0, 1.0, 1.0]),
          mutation = Stream().default({fogColor, fogDensity})
    
	return {
        environment: {
            mutation,
            get fogDensity(){ return fogDensity },
            set fogDensity(value){
                fogDensity !== value && (fogDensity = value)
                mutation.onSuccess({fogDensity})
            },
            get fogColor(){ return fogColor },
            set fogColor(value){
                fogColor !== value && vec3.copy(value, fogColor)
                mutation.onSuccess({fogColor})
            }
        }
	}
})