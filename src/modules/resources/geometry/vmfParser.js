import {Signal, factory} from '../../util'
import {decodeBuffer, VERTEX_ATTRIBUTE_TYPE} from '../../../tools/vmf'

factory.declare('loader', (target, options) => {
    const taskManager = options.manager
    
    target.RESOURCE_TYPE.MESH = 'mesh'
    
    target.appendParser((loader, resource, next) => {
        if(resource.extension !== 'vmf') return next()
        
        Signal.just(decodeBuffer(resource.data))
            .listen(data => next({
            data,
            type: loader.RESOURCE_TYPE.MESH
        }))
    })
})