import {vec3} from '../../math'

const MeshGraph = _ => Object.create(MeshGraph.prototype) //TODO extend graph, since clean and mark are the same
MeshGraph.prototype = {
    init: function(mesh){
        this.nodes = mesh
        this.dirtyNodes = this.nodes.slice()
        return this
    },
    neighbors: node => node.neighbours,
    cleanDirty: function(cleanNode){
        let idx = this.dirtyNodes.length
        while(idx--) cleanNode(this.dirtyNodes[idx])
        this.dirtyNodes.length = 0
    },
    markDirty: function(node){ this.dirtyNodes.push(node) },
    estimateWeight: (node, neighbour) => 1.0,
    heuristic: (a, b) => vec3.differenceSquared(a.centroid, b.centroid)
}

export {MeshGraph}