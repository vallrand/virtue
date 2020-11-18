import { snapshot, genRandomInt } from '../../modules/util'
import { rngSimple, vec2, vec3, vec4, quat, mat4 } from '../../modules/math'
import { logger } from '../../modules/debug/logger'

import {Stalker, StalkerAI} from './stalker'

export const CritterSpawner = (app, world, player) => {
    const critters = []
    const tempPosition = vec3()
    const navigationLayer = 'default'
    
    app.scene.addEventListener('navigation', layer => {
        for(let i = critters.length - 1; i >= 0; i--){
            vec3.translationFromMat4(critters[i].visual.modelMatrix, tempPosition)
            let node = app.scene.navigationMesh.detectNearestNode(tempPosition, navigationLayer, { checkBounds: true })
            let distance = vec3.distance(vec3.subtract(tempPosition, player.visual.position))
            if(node && distance < 124) continue

            logger.info('ai', `Eliminate entity. ${i}/${critters.length}`)
            world.removeEntity(critters[i])
            critters.splice(i, 1)
        }
        
        for(let i = critters.length; i < 1; i++){
            const position = vec3.add(player.visual.position, [genRandomInt(-10, 10), 0, genRandomInt(-10, 10)])
            const tile = app.scene.navigationMesh.detectNearestNode(position, navigationLayer)
            position[1] = tile.centroid[1]
            console.log(tile)
            
            const critter = world.addEntity(Stalker({ position, behavior: StalkerAI(app, world, player) }))

            logger.info('ai', `Spawn entity. ${position}`)
            critters.push(critter)
        }
    })
    app.scene.addEventListener('update', function(){
        app.scene.entities.forEach(entity =>  entity.highlight = [1, 1, 1])
        
        const entities = app.scene.raytrace(app.interaction.mouse.position)
        let closest, minDistance = Infinity
        for(let i = entities.length - 1; i >= 0; i--){
            let entity = entities[i]
            vec3.translationFromMat4(entity.modelMatrix, tempPosition)
            let distance = vec3.distance(vec3.subtract(tempPosition, player.visual.position))
            if(distance >= minDistance) continue
            minDistance = distance
            closest = entity
        }
		
        if(closest && !closest.ragdollEnabled && minDistance < 8){
            closest.highlight = [1, 0.8, 0.8]
            const entity = critters.find(entity => entity.visual.elements[0] === closest)
            entity.switchToRagdoll()
        }
    })
}