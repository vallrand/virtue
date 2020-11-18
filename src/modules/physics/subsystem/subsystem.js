import {tie, factory} from '../../util'
import {EventEmitter} from '../../events'
import {vec3, quat} from '../math'

factory.declare('physics', (target, options) => {
    const subsystems = []
    
    target.addEventListener('preStep', event => {
        for(let i = subsystems.length - 1; i >= 0; i--)
            subsystems[i].update(event.deltaTime)
    })
    
    return {
        subsystems
    }
})