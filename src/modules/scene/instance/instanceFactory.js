import {factory, Stream, tie} from '../../util'
import {Observable} from './observable'
import {Instance} from './instance'
import {Node} from './node'

const INSTANCE_GROUP = {
    STATIC: 'static',
    DYNAMIC: 'dynamic',
    SKINNED: 'skinned'
}

factory.declare('instance', Observable)
    .declare('instance', Node)
    .declare('instance', Instance) //TODO allow multiple to pass into factory declaration

factory.declare('instance', (target, options) => {
    const highlight = vec3.copy(options.highlight || vec3(1, 1, 1)) //TODO color?
    
    return {
        get highlight(){ return highlight },
        set highlight(value){ vec3.copy(value, highlight) },
        visible: true,
        get boundingSphereRadius(){
            const radius = target.delegate && target.delegate.data && target.delegate.data.boundingSphereRadius
            return (radius != null ? radius : 1.0) * Math.max(...target.scale)
        }
    }
})

factory.declare('scene', (target, options) => {
    const resourceManager = options.manager,
          instanceGroups = Object.create(null),
          resourceMap = Object.create(null)
    
	return {
        createInstance: options => {
            const id = options.url,
                  group = options.group || INSTANCE_GROUP.STATIC
            
            if(!id) return factory.build('instance', tie({ scene: target }, options))
            
            if(!resourceMap[id])
                (instanceGroups[group] = instanceGroups[group] || [])
                    .push(resourceMap[id] = tie(resourceManager.requestResource(id), {
                    id, group, instances: []
                }))
            
            const instance = factory.build('instance', tie({ delegate: resourceMap[id] }, options))
            instance.onCleanup(target.removeInstance.bind(target, instance)) //TODO add when no delegate as well
            resourceMap[id].instances.push(instance)
            target.dispatchEvent('instance', instance)
            return instance
        },
        fetchInstancesByGroup: group => instanceGroups[group] || [],
        removeInstance: instance => {
            const delegate = instance.delegate
            if(!delegate) return false
            delegate.instances.remove(instance)
            
            if(delegate.instances.length === 0){
                instanceGroups[delegate.group].remove(delegate)
                delete resourceMap[delegate.id]
                delegate.unload()
            }
        }
	}
})