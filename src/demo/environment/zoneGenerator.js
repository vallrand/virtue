import { snapshot, genRandomInt } from '../../modules/util'
import { rngSimple, vec2, vec3, vec4, quat, mat4 } from '../../modules/math'
import { logger } from '../../modules/debug/logger'

import { chamberA } from './chamberA'
import { chamberB } from './chamberB'
import { chamberC } from './chamberC'
import { chamberD } from './chamberD'
import { chamberE } from './chamberE'

import { SynchronizeDynamic } from './synchronizeDynamic'

const genRandomChar = rng => String.fromCharCode(genRandomInt('A'.charCodeAt(0), 'Z'.charCodeAt(0), rng))

const chambers = [
    chamberA,
    chamberB,
    chamberC,
    chamberD,
    chamberE
]

const cloneConfiguration = index => Object.assign(snapshot(chambers[index]), {
    behavior: [SynchronizeDynamic]
})

export const ZoneGenerator = (app, world, player) => {
    let head = {
        entity: world.addEntity(cloneConfiguration(0)),
        identifier: '0',
        neighbours: []
    }
        
    function unloadZone(zone){
        logger.info('spatial', `Unloading Zone: ${zone.identifier}`)
        world.removeEntity(zone.entity)
        
        for(let i = zone.neighbours.length; i >= 0; i--){
            let neighbour = zone.neighbours[i]
            if(!neighbour) continue
            let index = neighbour.neighbours.indexOf(zone)
            neighbour.neighbours[index] = null
        }
    }
    
    function loadZone(parent, connector){
        const rng = rngSimple(connector.position[0] + 0xFFFF0000 * connector.position[2] + 0x0f) //TODO how to go back?
        const zoneOptions = cloneConfiguration(genRandomInt(0, chambers.length - 1, rng))
        const zoneConnector = zoneOptions.metaData.connectors[genRandomInt(0, 1, rng)]
        const identifier = Array.range(5).map(i => i < 2 ? genRandomChar(rng) : genRandomInt(0, 9, rng)).join('')
        
        logger.info('spatial', `Loading Zone: ${identifier}`)
        const normal = vec3.negate(connector.normal)
        const angle = vec2.angle([normal[0], normal[2]], [zoneConnector.normal[0], zoneConnector.normal[2]])
        const orientation = quat.setAxisAngle(vec3.AXIS_Y, angle)
        
        applyRotation: {
            vec3.transformQuat(zoneOptions.visual.position, orientation, zoneOptions.visual.position)
            quat.multiply(orientation, zoneOptions.visual.rotation, zoneOptions.visual.rotation)

            zoneOptions.imposter.forEach(body => vec3.transformQuat(body.position, orientation, body.position))
            zoneOptions.imposter.forEach(body => quat.multiply(orientation, body.quaternion, body.quaternion))

            zoneOptions.metaData.connectors.forEach(connector => vec3.transformQuat(connector.position, orientation, connector.position))
            zoneOptions.metaData.connectors.forEach(connector => vec3.transformQuat(connector.normal, orientation, connector.normal))
        }
        
        const offset = vec3.subtract(connector.position, zoneConnector.position)
        
        applyTranslation: {
            vec3.add(offset, zoneOptions.visual.position, zoneOptions.visual.position)

            zoneOptions.imposter.forEach(body => vec3.add(offset, body.position, body.position))

            zoneOptions.metaData.connectors.forEach(connector => vec3.add(offset, connector.position, connector.position))
        }
        
        let zone = {
            entity: world.addEntity(zoneOptions),
            identifier,
            neighbours: []
        }

        zone.neighbours[zoneOptions.metaData.connectors.indexOf(zoneConnector)] = parent
        return zone
    }
    
    const radius = {
        upperBound: Math.pow(75, 2),
        lowerBound: Math.pow(50, 2)
    }
    
    
    /*
    window.pp = vec3.copy(player.visual.position)
    //vec3.copy(app.scene.camera.position, window.pp)
    var p1 = [9.946831703186035, -36.47526168823242, -113.07559967041016]
    var p2 = [105.90489959716797, -30.81569480895996, -110.06048583984375]
    var i = 0
    var id = setInterval(() => {
    i++
    if(i % 2 == 0) vec3.copy(p1, window.pp)
    else vec3.copy(p2, window.pp)
    
    if(i > 100) clearInterval(id)
    
    }, 100)
    */
    
    app.scene.addEventListener('update', function(){
        const position = player.visual.position  //window.pp//
        
        const connectors = head.entity.metaData.connectors
        let minDistance = Infinity,
            minIndex = 9
        for(let i = connectors.length - 1; i >= 0; i--){
            let connector = connectors[i]
            
            let distance = vec3.differenceSquared(position, connector.position)
            if(head.neighbours[i] && distance > radius.upperBound)
                unloadZone(head.neighbours[i])
            
            if(distance > minDistance) continue
            minDistance = distance
            minIndex = i
        }
        
        if(!head.neighbours[minIndex] && minDistance < radius.lowerBound)
            head.neighbours[minIndex] = loadZone(head, connectors[minIndex])
        let side = vec3.dot(connectors[minIndex].normal, vec3.subtract(connectors[minIndex].position, position))
        //TODO: in case of jumps zone will be unloaded before we are allowed to enter
        if(side < 0 && head.neighbours[minIndex]){
            head = head.neighbours[minIndex]
            logger.info('spatial', `Entering Zone: ${head.identifier}`)
        }
        
    })
}