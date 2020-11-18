import {factory} from '../util'
import {AnimationClip} from './clip'



factory.declare('instance', (target, options) => {
    if(options.group !== 'skinned') return null
    const mixerStack = []

    return {
        get animationClip(){ return mixerStack },
        update: (deltaTime => {
            for(let i = mixerStack.length - 1; i >= 0; i--){
                let clip = mixerStack[i]
                clip.time += clip.scale * deltaTime/1000
                if(clip.repeat == 0) mixerStack.splice(i, 1)
            }
        }).extend(target.update),
        insertClip: (layer, repeat, scale) => { //TODO blending
            mixerStack.push(AnimationClip(layer, repeat, scale))
        }
    }
})

factory.declare('scene', target => {
    target.addEventListener('update', deltaTime => {
        target.fetchInstancesByGroup('skinned').forEach(mesh => mesh.instances.forEach(instance => instance.update(deltaTime)))
    })
})