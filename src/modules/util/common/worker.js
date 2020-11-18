import {tie} from './factory'
import {Queue} from './queue'

const worker = (core => {
    const queue = Queue()
    let requestId = null
    
    const drain = function(){
        let callback = null
        while(callback = queue.shift())
            callback()
        requestId = null
    }
    
    return tie(core, {
        schedule: callback => (queue.push(callback), requestId || (requestId = window.setTimeout(drain, 0))) //::ALTERNATIVE:: window.requestAnimationFrame(drain)
    })
})(Object.create(null))

const defer = (callback, time = 0) => time ? window.setTimeout(callback, time) : worker.schedule(callback)

export {worker, defer}