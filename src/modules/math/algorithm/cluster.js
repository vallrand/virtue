import {tie} from '../../util'
import {EventEmitter} from '../../events'
import {vec3} from '../structs'

const Cluster = options => {
    options = Object.assign({
        padding: 1e-3,
        capacityThreshold: Infinity,
        capacityScale: 0
    }, options || {})
    const cluster = Object.create(null),
          positions = [],
          pointers = [],
          accumulativeCentroid = vec3(0),
          centroid = vec3()
    let maxConnection = 0,
        connectionFactor = 0
    
    return tie(cluster, {
        index: options.index,
        get pointers(){ return pointers },
        recompute: _ => {
            vec3.scale(accumulativeCentroid, 1/positions.length, centroid)
            positions.forEach(position => maxConnection = Math.max(maxConnection, vec3.differenceSquared(position, centroid)))
            connectionFactor = (1 + options.padding - Math.max(0, positions.length - options.capacityThreshold) * options.capacityScale) * maxConnection
        },
        computeWeight: position => +positions.length && vec3.differenceSquared(position, centroid) - connectionFactor,
        add: (position, pointer) => {
            positions.push(position)
            pointers.push(pointer)
            
            vec3.add(accumulativeCentroid, position, accumulativeCentroid)
            cluster.recompute()
        },
        remove: pointer => {
            let idx = pointers.indexOf(pointer)
            if(idx == -1) return false
            
            vec3.subtract(accumulativeCentroid, positions[idx], accumulativeCentroid)
            cluster.recompute()
            
            positions.splice(idx, 1)
            pointers.splice(idx, 1)
        },
        get size(){ return positions.length },
        get averageVolume(){ return positions.reduce((total, position) => total + vec3.differenceSquared(centroid, position), 0) / positions.length }
    })
}

const StaticClusterPartitioning = options => { //TODO add update cost threshold, to not reinsert objects all the time
    options = Object.assign({
        worldScale: 100,
        limit: 20,
        index: 0
    }, options || {})
    const target = Object.create(null),
          clusters = [Cluster(options)]
    
    return tie(target, {
        add: (position, pointer) => {            
            let clusterIdx, minWeight = Number.MAX_VALUE
            for(let i = clusters.length - 1; i >= 0; i--){
                let weight = clusters[i].computeWeight(position)
                if(weight >= minWeight) continue
                minWeight = weight
                clusterIdx = i
            }
            
            minWeight /= options.worldScale
            if(minWeight > 1 && clusters.length < options.limit) clusterIdx = (options.index++, clusters.push(Cluster(options)) - 1)
            const cluster = clusters[clusterIdx],
                  prevCluster = pointer.partitionCluster
            
            if(prevCluster) if(prevCluster === cluster) return true
            else target.remove(pointer)
            
            cluster.add(position, pointer)
            target.dispatchEvent('add', pointer.partitionCluster = cluster)
        },
        remove: (pointer) => {
            let cluster = pointer.partitionCluster,
                clusterIdx = clusters.indexOf(cluster)
            delete pointer.partitionCluster
            cluster.remove(pointer)
            if(clusterIdx == -1) return false
            if(!cluster.size) target.dispatchEvent('remove', clusters.splice(clusterIdx, 1)[0])
        },
        get clusters(){ return clusters }
    }, EventEmitter())
}

export {StaticClusterPartitioning, Cluster}