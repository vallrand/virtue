import { vec3, vec4, mat4, dualquat, quat } from '../../modules/math'
import { deserialize } from '../../modules/physics'
import { buildRagdoll } from './ragdoll'
import { genRandomInt, genRandomFloat } from '../../modules/util'
import { Boid, FollowObjective } from '../../modules/behavior'

const RandomRepeat = (cooldown, callback) => {
    let timeRemaining = typeof cooldown == 'function' ? cooldown() : cooldown
    return function update(deltaTime){
        timeRemaining -= 0.001 * deltaTime
        if(timeRemaining >= 0) return
        
        callback(timeRemaining)
        timeRemaining = typeof cooldown == 'function' ? cooldown() : cooldown
    }
}

const STATES = {
    DEAD: -1,
    FOLLOW: 0,
    RAGDOLL: 1
}

export const StalkerAI = (app, world, player) => entity => {
    entity.state = STATES.FOLLOW
    const visual = entity.visual
    const harness = visual.elements[0]
    
    harness.insertClip(0, -1, 1)
    
    const boid = Boid({ position: visual.position, maxSpeed: 0.016, maxForce: 0.001 }) //TODO should be updated from scene separately (since it needs list of near objects, etc)
    const followPlayer = FollowObjective(app.scene, player.visual) //TODO inject as a dependecy
    const traversePath = (path, index) => { //TODO switch from follow - random wander mode
        if(index < path.length - 1) boid.wander(0.004, Math.PI * 0.1)
        return boid.followPath(index, path, false)
    }
    
    const sounds = [
         visual.elements[1],
         visual.elements[2]
    ]
    let randomNoise = RandomRepeat(genRandomFloat.bind(null, 5, 20), function(){
        sounds[genRandomInt(0, sounds.length - 1)].play()
    })
    
    entity.switchToRagdoll = function(){
        if(entity.state !== STATES.FOLLOW) return
        entity.state = STATES.RAGDOLL
        //TODO load event listener in wrong place
        
        harness.bindRagdoll(bones => buildRagdoll(app, harness, bones))
        harness.ragdollEnabled = true
    }
    
    return {
        update: (deltaTime, updateContext) => {
            if(entity.state === STATES.FOLLOW){
                followPlayer(visual.position, traversePath)
                boid.update(deltaTime)
                randomNoise(deltaTime)
            }
        },
        synchronize: _ => {
            if(entity.state === STATES.FOLLOW){
                visual.position = boid.position
                visual.rotation = boid.rotation
            }
        },
        clear: _ => {
            entity.state = STATES.DEAD
        }
    }
}

export const Stalker = options => ({
    visual: {
        className: 'instance',
        position: options.position,
        nodes: [{
            className: 'instance',
            trackSpatial: true,
            group: 'skinned',
            url: 'assets/critters/stalker.vmf',
            position: [0, 1.36, 0],
            scale: [1, 1, 1],
            rotation: quat.setAxisAngle(vec3.AXIS_Y, Math.PI)
        }, {
            className: 'audio', url: 'assets/sounds/stalker-a.mp3', position: [0, 0, 0], volume: 1, loop: false
        }, {
            className: 'audio', url: 'assets/sounds/stalker-b.mp3', position: [0, 0, 0], volume: 1, loop: false
        }]
    },
    behavior: [options.behavior],
    imposter: []
})