import {factory, tie, Signal} from '../../util'
import {vec3, astar} from '../../math'
import {MeshGraph} from './graph'
import {Funnel} from './funnel'
import {groupNavigationMesh, attachNavigationMesh, detachNavigationMesh} from './group'
import {buildConfigurationSpace, linkNavigationGeometry} from './generation'
import {findClosestNode} from './util'

factory.declare('navigation_mesh', (target, options) => { //TODO async pathfinding
    const layers = Object.create(null),
          taskManager = options.taskManager,
          syncWrapLayer = (layer, nextTask) => 
              (layers[layer] = layers[layer] || { queue: Signal.just({}) })
              .queue = layers[layer].queue
              .pipe(layerData => nextTask.call(target, layerData.groups))
              .pipe(layerGroups => tie(layers[layer], {
                  groups: layerGroups,
                  graph: MeshGraph().init(layerGroups.map(group => group.polygons).flatten())
              }))
    
    return {
        get layers(){ return layers },
        //TODO default value for layer?
        buildNodes: (solidGeometry, layer) => taskManager.runGenerator(buildConfigurationSpace(solidGeometry, { steepness: Math.PI / 3 }))
        .pipe(geometry => taskManager.runGenerator(linkNavigationGeometry(geometry)))
        .pipe(navigationMesh => taskManager.runGenerator(groupNavigationMesh(navigationMesh, { expectedGroups: 1 })))
        .pipe(nodeGroups => syncWrapLayer(layer, groups => taskManager.runGenerator(attachNavigationMesh(groups, nodeGroups)))),
        deleteNodes: (layer, group) => syncWrapLayer(layer, groups => taskManager.runGenerator(detachNavigationMesh(groups, group))), //TODO why pointer to group array?
        detectNearestNode: (position, layer, options) => {
            if(!layers[layer]) return null            
            const closestNode = layers[layer].groups.reduce((nodeA, nodeB, idx) => (
                nodeB = findClosestNode(position, nodeB.polygons, nodeB.vertices, options),
                nodeA && nodeA.distance < nodeB.distance ? nodeA : nodeB.node && nodeB), null)
            return closestNode && closestNode.node
        },
        queryNodes: (layer, nearPosition, nearRange) => {
            if(!layers[layer]) return null
            let nearRangeSquared = nearRange * nearRange
            return layers[layer].groups
                .map(group => group.polygons.filter(polygon => vec3.differenceSquared(nearPosition, polygon.centroid) < nearRangeSquared))
                .flatten()
        },
        findPath: (startPosition, targetPosition, layer) => { //TODO if path is impossible (when positions belong to different groups)
            if(!layers[layer]) return null //if not loaded return signal?
            const closestNode = target.detectNearestNode(startPosition, layer),
                  farthestNode = target.detectNearestNode(targetPosition, layer, { checkBounds: true }),
                  graph = layers[layer].graph
            if(!closestNode || !farthestNode) return null

            const nodeList = astar.search(graph, closestNode, farthestNode)
            
            const pathBuilder = Funnel()
            pathBuilder.push(startPosition)
            for(let i = 1, length = nodeList.length; i < length; i++){
                let prevPolygon = nodeList[i - 1],
                    polygon = nodeList[i],
                    portals = prevPolygon.portals[prevPolygon.neighbours.indexOf(polygon)]
                pathBuilder.push(portals[0], portals[1])
            }
            pathBuilder.push(targetPosition)
            const path = pathBuilder.traverse()
            return path.slice(1)
            //TODO additional path smoothing? as a separate function
        }
    }
})