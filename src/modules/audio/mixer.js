import { factory, Signal } from '../util'

factory.declare('audio_context', (target, options) => {
    const audioCtx = target.ctx
    const masterGain = audioCtx.createGain()
    
    if(options.compressor){
        const compressor = audioCtx.createDynamicsCompressor()
        compressor.threshold.value = 10
        compressor.ratio.value = 20
        compressor.reduction.value = -20
        masterGain.connect(compressor)
        compressor.connect(audioCtx.destination)
    }else{
        masterGain.connect(audioCtx.destination)
    }
    
    target.components.push(context => {
        context.gainNode = context.audio.createGain()
        context.volume = 1
        
        context.nodes.unshift(context.gainNode)
        context.gainNode.connect(masterGain)
        
        return function update(instance){
            if(instance.volume == context.volume) return
            context.volume = instance.volume
            context.gainNode.gain.setValueAtTime(context.volume, context.audio.currentTime)
        }
    })
})