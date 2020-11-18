import {Signal, factory} from '../../util'

function decodeBase64(dataURI){
    const data = atob(dataURI.split(',')[1])
    const dataView = new Uint8Array(data.length)
    for(let i = 0; i < data.length; i++)
        dataView[i] = data.charCodeAt(i)
    return dataView.buffer
}

factory.declare('loader', (target, options) => {
    target.RESOURCE_TYPE.AUDIO = 'audio'
    
    target.appendParser((loader, resource, next) => {
        if(resource.extension !== 'mp3') return next()
        
        next({
            data: resource.data,
            type: loader.RESOURCE_TYPE.AUDIO
        })
    })
})