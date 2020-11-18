import {factory, Queue, Signal} from '../util'

factory.declare('application', target => {
    const time = target.time,
          tasks = Queue(),
          maxInterval = 1000 / 60,
          thresholdStep = 250 / 60
    let elapsedTime = 0,
        threshold = 0,
        task = null
    
    time.pulse.pipe(event => {
        let prevTimestamp = event.timestamp
        elapsedTime = time.timestamp - prevTimestamp - threshold
        threshold = Math.max(0, threshold + (elapsedTime > maxInterval ? thresholdStep : -thresholdStep))
        while(elapsedTime < maxInterval && (task = tasks.shift())) elapsedTime = (task(), time.timestamp - prevTimestamp)
    }).fix(e => console.error(e))
    
    return {
        get tasks(){ return tasks },
        schedule: (task, duplicate = true) => duplicate ? tasks.push(task) : (tasks.hasElement(task) || tasks.push(task)),
        deferIteration: (processor, end, begin = 0, chunkMaxSize = Number.MAX_SAFE_INTEGER, out) => Signal(done => {
            for(let offset = begin; offset < end; offset += chunkMaxSize)
                target.schedule(target.iterateChunk.bind(target, processor, offset + Math.min(chunkMaxSize, end - offset), offset))
            target.schedule(done.bind(null, out))
        }),
        iterateChunk: (processor, end, begin = 0) => { for(let i = begin; i < end; processor(i++)); },
        deferredMap: (processor, array, chunkMaxSize, out = []) => target.deferIteration(i => out[i] = processor(array[i], i, array), array.length, 0, chunkMaxSize, out),
        runGenerator: generator => Signal(done => {
            const next = _ => {
                const generatorState = generator.next()
                generatorState.done ? done(generatorState.value) : target.schedule(next)
            }
            target.schedule(next)
        })
    }
})

const immediateInvoker = { schedule: task => task() }

export {immediateInvoker}