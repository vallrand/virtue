import {Signal, factory} from '../../util'

factory.declare('loader', (target, options) => {
    const taskManager = options.manager,
          parsers = []
    
    return {
        taskManager,
        appendParser: parsers.push.bind(parsers),
        RESOURCE_TYPE: Object.create(null),
        parse: (url, resource) => Signal(done => {
            let idx = 0
            const parsersSnapshot = parsers.slice(),
                  length = parsersSnapshot.length,
                  next = value => idx >= length ? done(value || resource) : parsersSnapshot[idx++].call(target, target, resource = value || resource, next.once())
            next(resource)
        })
    }
})