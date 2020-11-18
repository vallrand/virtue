import {logger} from '../debug/logger'
import {tie, factory, Signal} from '../util'
import {vec3, quat} from '../math'
import {deserialize} from '../geometry'

//TODO this is adapter? Hopefully will move to better place soon
factory.declare('scene', (target, options) => {
    const taskManager = options.manager
    //TODO check options if nav mesh is enabled?
    const navigationMesh = factory.build('navigation_mesh', { taskManager })

    return {
        navigationMesh,
        addSolidGeometry: solidObjects => { //TODO async defer, return signal of area
            const solidGeometry = deserialize(solidObjects)
            if(!solidGeometry.length) return null
            
            return {
                navigationConstructionEvent: navigationMesh.buildNodes(solidGeometry, 'default')
                .pipe(layer => {
                    let group = layer.groups[layer.groups.length - 1]
                    logger.info('navigation', `Navigation mesh group attached.`) //TODO uuid?
                    target.dispatchEvent('navigation', layer)
                    return group
                }).fix(error => console.error(error))
            }
        },
        removeSolidGeometry: solidGeometry => {
            solidGeometry.navigationConstructionEvent
                .pipe(group => navigationMesh.deleteNodes('default', group))
                .pipe(layer => {
                logger.info('navigation', 'Navigation mesh chunk detached.')
                target.dispatchEvent('navigation', layer)
            })
        }
    }
})

const FollowObjective = (scene, target, options) => {
    options = Object.assign({
        distanceThreshold: 10 * 10,
        navigationLayer: 'default'
    }, options || {})
    
    const lastPosition = vec3()
    let path = null,
        wayPointIndex = 0
    
    return (position, traverse) => { //TODO: threshold should be based on distance tp target
        if(vec3.differenceSquared(lastPosition, target.position) > options.distanceThreshold){ //TODO doesn't recalc if failed to find (though it doesn't know why)
            vec3.copy(target.position, lastPosition)
            
            const agentPosition = position,
                  agentTargetPosition = lastPosition
            path = scene.navigationMesh.findPath(agentPosition, agentTargetPosition, options.navigationLayer)
            wayPointIndex = 0
            logger.info('ai', `Recalculating path. length ${path && path.length}`)
        }
        if(path) wayPointIndex = traverse(path, wayPointIndex)
        else traverse([position], 0)
    }
}

export {FollowObjective}