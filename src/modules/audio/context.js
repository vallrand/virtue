import { factory, Signal } from '../util'

function unlockAudio(audioCtx){
    function unlock(){
        window.removeEventListener('mousedown', unlock)
        window.removeEventListener('touchend', unlock)
        audioCtx.resume()
    }
    window.addEventListener('mousedown', unlock)
    window.addEventListener('touchend', unlock)
}

factory.declare('audio_context', (target, options) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const scene = options.scene
    
    unlockAudio(audioCtx)
    
    scene.addEventListener('audio_source', (instance, buffer) => {
        const context = { audio: audioCtx, nodes: [] }
        const procedures = target.components.map(initialize => initialize(context))
                
        function update(){
            for(let i = procedures.length - 1; i >= 0; i--)
                procedures[i](instance)
        }
        instance.onCleanup(function(){
            procedures.length = 0
            context.nodes.forEach(node => node.disconnect())
            context.nodes.length = 0
            context.audio = context.buffer = null
        })
        
        buffer.loadEvent.pipe(function(){
            if(!context.audio) return
            context.buffer = buffer.data
            
            instance.mutation.attach(update, null, false)
            update()
        })        
    })
    
	return {
        ctx: audioCtx,
        set pause(value){
            if(audioCtx.state === 'running' && value)
                audioCtx.suspend()
            else if(audioCtx.state !== 'running' && !value)
                audioCtx.resume()
        },
        uploadAudioBuffer: audioData => Signal(done => audioCtx.decodeAudioData(audioData, buffer => done(buffer))),
        components: []
	}
})