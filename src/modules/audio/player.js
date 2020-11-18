import { factory, Signal } from '../util'

function initializeAudioSource(context){
    context.sourceNode = context.audio.createBufferSource()
    context.sourceNode.buffer = context.buffer
    
    context.sourceNode.playbackRate.value = context.rate
    context.sourceNode.loop = context.loop
    context.sourceNode.loopStart = 0
    context.sourceNode.loopEnd = context.buffer.duration
    
    context.sourceNode.connect(context.nodes[0])
}

factory.declare('audio_context', (target, options) => {
    target.components.push(context => {
        context.loop = true
        context.playhead = 0
        context.rate = 1
        context.startTime = null
        
        return function update(instance){
            if(!context.buffer) return
            if(context.startTime == instance.startTime && context.loop == instance.loop) return
            const restart = context.startTime != instance.startTime
            
            context.loop = instance.loop
            context.startTime = instance.startTime
            
            const timeOffset = instance.startTime - instance.time
            const currentTime = context.audio.currentTime
            
            if(context.sourceNode){
                const timeElapsed = currentTime - context.prevTime
                context.playhead = (context.playhead + timeElapsed) % context.buffer.duration
                context.sourceNode.stop(0)
            }
            
            if(restart){
                context.sourceNode = null
                context.playhead = 0
            }
            if(context.startTime == null) return
            
            initializeAudioSource(context)
            
            context.prevTime = currentTime + Math.max(0, timeOffset)
            context.playhead += Math.max(0, -timeOffset)
            context.sourceNode.start(context.prevTime, context.playhead, undefined)
            //context.sourceNode.onended = function(){}
        }
    })
})