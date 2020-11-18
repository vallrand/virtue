import {factory, defer, tie, Signal} from '../../util'
import {vec3, mat4, StaticClusterPartitioning} from '../../math'

factory.declare('scene', (target, options) => {
    const clusterPartitioning = StaticClusterPartitioning({ worldScale: 100 }),
          mutatedInstances = [],
          mutatedClusters = [],
          addDeferredInstance = instance => mutatedInstances.indexOf(instance) == -1 && mutatedInstances.push(instance),
          addDeferredCluster = cluster => {
              if(cluster.awaitEvent) return false
              const loadQueue = cluster.pointers
              .unique(instance => instance.delegate.id)
              .map(instance => instance.delegate.loadEvent)
              .filter(signal => !signal.status)
              if(!loadQueue.length) return clusterPartitioning.dispatchEvent('complete', cluster), true
              cluster.awaitEvent = Signal.all(loadQueue).pipe(_ => addDeferredCluster((cluster.awaitEvent = false, cluster)))
          }
    
    clusterPartitioning.addEventListener('add', cluster => mutatedClusters.indexOf(cluster) == -1 && mutatedClusters.push(cluster))
    
    target.addEventListener('update', function(){
        if(mutatedInstances.length){
            mutatedInstances.forEach(instance => {
                const worldPosition = vec3.translationFromMat4(instance.modelMatrix)
                clusterPartitioning.add(worldPosition, instance)
            })
            mutatedInstances.length = 0
            
            mutatedClusters.forEach(addDeferredCluster)
            mutatedClusters.length = 0
        }
    })
    
	return {
        clusterPartitioning,
        createInstance: (base => options => {
            const instance = base(options)
            
            if(instance.delegate && instance.delegate.group === 'static'){
                addDeferredInstance(instance)
                instance.onCleanup(mutatedInstances.remove.bind(mutatedInstances, instance))
                instance.onCleanup(clusterPartitioning.remove.bind(clusterPartitioning, instance))
                instance.mutation.pipe(addDeferredInstance.bind(null, instance))
            }
            
            return instance
        })(target.createInstance)
	}
})