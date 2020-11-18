import { factory, tie, Signal } from '../../util'
import { Observable, Instance } from '../instance'

factory.declare('scene', (target, options) => {
    const resourceManager = options.manager
    const audioSources = []
    
    target.addEventListener('update', deltaTime => {
        deltaTime *= 0.001
        for(let i = audioSources.length - 1; i >= 0; i--)
            audioSources[i].time += deltaTime
    })
    
    return {
        createAudioSource: options => {
            const source = resourceManager.requestResource(options.url)
            
            const instance = factory.build('audio_source', options)
            target.dispatchEvent('audio_source', instance, source)
            audioSources.push(instance)
            instance.onCleanup(audioSources.remove.bind(audioSources, instance))
            return instance
        }
    }
})

factory.declare('audio_source', Observable)
factory.declare('audio_source', Instance)
factory.declare('audio_source', (target, options) => {
    options = Object.assign({
        volume: 1,
        loop: true,
        startTime: null
    }, options)
    
    return {
        time: 0,
        startTime: options.startTime,
        get volume(){ return options.volume },
        get loop(){ return options.loop },
        set volume(value){
            options.volume = value
            target.propagate(0, value, target)
        },
        set loop(value){
            options.loop = value
            target.propagate(0, value, target)
        },
        play(){
            target.startTime = target.time
            target.propagate(0, null, target)
        },
        stop(){
            target.startTime = null
            target.propagate(0, null, target)
        }
    }
})