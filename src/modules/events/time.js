import {factory, Stream} from '../util'

factory.declare('time', target => {
    let requestId = null,
        prevTimestamp = 0,
        stream = Stream() //TODO turn async off?
    
    const update = timestamp => {
        const deltaTime = timestamp - prevTimestamp
        prevTimestamp = timestamp
        stream.onSuccess({metronome: target, deltaTime, timestamp})
        if(requestId) requestId = window.requestAnimationFrame(update)
    }
    
    return {
        pulse: stream,
        get time(){ return prevTimestamp },
        get timestamp(){ return window.performance.now() },
        get paused(){ return requestId === null },
        set paused(value){ value ? target.pause() : target.start() },
        start: () => (requestId || (requestId = window.requestAnimationFrame(update)), target),
        pause: () => (requestId = (!requestId || window.cancelAnimationFrame(requestId), null), target)
    }
})