import {Signal, factory} from '../../util'
import {PNGDecoder} from './pngDecoder'

factory.declare('loader', (target, options) => {
    const taskManager = options.manager
    
    target.RESOURCE_TYPE.TEXTURE = 'texture'
    
    target.appendParser((loader, resource, next) => {
        if(resource.extension !== 'png') return next()
        
        PNGDecoder.process(resource.data, loader.taskManager)
            .listen(data => next({
            data,
            type: loader.RESOURCE_TYPE.TEXTURE
        }))
    })
})