import {factory, Queue, Signal, path} from '../util'

factory.declare('application', target => {
    const loader = factory.build('loader', {manager: target}),
          GLContext = target.ctx,
          audioContext = target.audio,
          resources = Object.create(null)
    
    return {
        unloadResource: url => { //TODO handle resource management, defer
            if(!resources[url].loaded) return false
            if(resources[url].data.unload) resources[url].data.unload() //TODO save timestamp for threshold to delete resource?
            delete resources[url]
        },
        requestResource: url => resources[url] || (resources[url] = {
            loaded: false,
            unload: target.unloadResource.bind(target, url),
            loadEvent: loader.fetch(url).split(
                resource => {
                    if(resource.type !== loader.RESOURCE_TYPE.MESH) return null
                    return GLContext.uploadMeshData(resource.data, null, false)
                        .pipe(mesh => (mesh.materials.forEach(material => material.textures = material.textures || material.textureNames
                                                .filter(x => x)
                                                .map(filename => path(url).base + filename)
                                                .map(fullpath => target.requestResource(fullpath))), mesh))
                },
                resource => {
                    if(resource.type !== loader.RESOURCE_TYPE.TEXTURE) return null
                    return GLContext.uploadTexture(resource.data)
                },
                resource => {
                    if(resource.type !== loader.RESOURCE_TYPE.AUDIO) return null
                    return audioContext.uploadAudioBuffer(resource.data)
                },
                any => {
                    if(!loader.pending.length) GLContext.deferredDataUpload()
                    return null
                }
            ).pipe(responses => responses.find(x => x))
            .pipe(resource => {
                resources[url].loaded = true
                resources[url].data = resource
                return true
            })
        })
    }
})