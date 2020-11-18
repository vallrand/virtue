import {factory, Signal, Stream} from '../../util'

const cache = Object.create(null)

factory.declare('loader', (target, options) => {
    const pending = Object.create(null),
          batchSize = options.batchSize || 4,
          loadQueue = Stream()
    
    loadQueue.buffer(batchSize, (url, onLoad, onError) => 
                     (cache[url] ? Signal.just(cache[url]) : 
                     factory.build('resource', { url })
                     .load()
                     .pipe(data => target.parse(url, data)))
                     .listen(data => onLoad((pending[url].onSuccess((delete pending[url], cache[url] = data)), data)), 
                             error => onError((pending[url].onError(error), error))
                    ))
    
    return {
        fetch: url => pending[url] || (loadQueue.onSuccess(url), pending[url] = Signal()),
        get pending(){ return Object.keys(pending).filter(el => el) }
    }
})

export {cache}