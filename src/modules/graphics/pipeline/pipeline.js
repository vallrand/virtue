import {factory, Signal} from '../../util'

factory.declare('pipeline', target => {
    const queue = []
    let frame = 0
    
    return {
        pass: callable => (queue.push(callable), target),
        clear: callable => (callable ? queue.remove(callable) : queue.length = 0, target),
        run: (ctx, scene) => Signal(flush => {
            let idx = 0
            const next = _ => idx >= queue.length ? flush(frame++) : queue[idx++].call(target, ctx, scene, next.once(), frame)
            next()
        })
    }
})