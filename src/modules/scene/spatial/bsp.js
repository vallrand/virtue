import { Octree, vec3 } from '../../math'

const OctreeObjectSegmentMappers = {
    boundingSphere: object => [{
        get radius(){ return object.boundingSphereRadius },
        get position(){ return object.cachedPosition = vec3.translationFromMat4(object.modelMatrix, object.cachedPosition || vec3()) }
    }]
}

const BinaryPartitionTree = options => {
    const octree = Octree({overlapPercent: 0.15, objectsThreshold: 8})
    
    return {
        octree,
        add: (object, options) => {
            octree.add(object, OctreeObjectSegmentMappers.boundingSphere)
        },
        search: (ray, radius, options) => {
            let result = octree.search(ray.origin, radius, ray.direction, { groupByObject: true })
            return result.map(o => o.object)
        },
        update: _ => {
            octree.rebuild()
            octree.update()
        },
        remove: object => {
            octree.remove(object)
        }
    }
}
	
export {BinaryPartitionTree, OctreeObjectSegmentMappers}