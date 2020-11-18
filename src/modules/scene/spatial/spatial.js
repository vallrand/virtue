import {factory, defer} from '../../util'
import {vec3, mat4, Raycaster} from '../../math'
import {BinaryPartitionTree} from './bsp'

factory.declare('scene', (target, options) => {
    const bsp = BinaryPartitionTree() //TODO: separate BSP for dynamic and static objects
    //const grid = Grid()
    const entities = []
    
	return {
        bsp,
        removeInstance: (base => instance => {
            entities.remove(instance)
            bsp.remove(instance)
            return base(instance)
        })(target.removeInstance),
        createInstance: (base => options => {
            const instance = base(options)
            //TODO: save to queue, for removing it later, if it wasn't loaded yet
            if(options.trackSpatial){
                instance.delegate ? instance.delegate.loadEvent.listen(bsp.add.bind(bsp, instance)) : bsp.add(instance)
                entities.push(instance)
            }
            
            return instance
        })(target.createInstance),
        update: (deltaTime => {
            bsp.update()//TODO validate performance
        }).extend(target.update),
        raytrace: sceenCoords => {
            const raycaster = Raycaster.fromCamera(target.camera, sceenCoords)
            return bsp.search(raycaster.ray, Infinity)
            .filter(entity => raycaster.intersect(entity)) //TODO should raycaster know about modelMatrices etc?
        },
        get entities(){ return entities }
	}
})