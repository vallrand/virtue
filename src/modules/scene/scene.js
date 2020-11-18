import {tie, factory, Signal} from '../util'
import {EventEmitter} from '../events'
import {vec3, vec4} from '../math'

factory.declare('scene', target => {
    const camera = factory.build('camera')
    
	return tie({
        camera,
        update: deltaTime => {
            target.dispatchEvent('update', deltaTime)
            camera.recalculateView()
        }
	}, EventEmitter())
})