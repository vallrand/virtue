import {setupConfiguration} from './settings'
import {World} from './core'
import {Player, Weapon} from './player'
import {ZoneGenerator} from './environment'
import {CritterSpawner, Stalker, StalkerAI} from './critters'

export const DemoGame = app => { //TODO create container?
        window.app = app
        window.vec3 = V.math.vec3
        window.quat = V.math.quat
        window.physics = V.physics
    
    setupConfiguration(app)
    
    const world = World(app)
    
    setupEnvironment: {
        app.physics.gravity[1] = -9.81

        app.scene.createLight({type: 'hemisphere', up: [0,1,0], skyColor: [0.05,0.3,0.3], groundColor: [0.1,0.1,0]})

        app.scene.environment.fogDensity = 0.0064
        app.scene.environment.fogColor = [0.2,0.2,0.2]
    }
    
    const player = world.addEntity({ //TODO evaluate if it needs to be in engine or is it game-specific?
        visual: {
            className: 'instance',
            nodes: [
                { className: 'instance', group: 'skinned', url: 'assets/critters/arms.vmf', position: [0.5, -0.2, -0.6], rotation: quat.setAxisAngle(vec3.AXIS_Y, 1.04 * Math.PI), scale: [1, 1, 1] },
                { className: 'audio', url: 'assets/sounds/footsteps-concrete.mp3', position: [0, 0, 0], volume: 1, loop: true },
                { className: 'audio', url: 'assets/sounds/footsteps-metal.mp3', position: [0, 0, 0], volume: 1, loop: true },
                { className: 'audio', url: 'assets/sounds/dark-ambience.mp3', position: [0, 0, 0], volume: 0.5, loop: true },
                { className: 'audio', url: 'assets/sounds/projectile.mp3', position: [0, 0, 0], volume: 0.5, loop: false }
            ]
        },
        behavior: [
            Player(app.scene.camera, app.interaction, app, {
				weapon: Weapon(world)
			})
        ],
        imposter: [{
            material: 'playerMaterial',
            angularDamping: 1,
            linearDamping: 0,
            mass: 16,
            fixedRotation: true,
            visual: !true,
            position: 
            [88, -20, -115],
            quaternion: quat.setAxisAngle(vec3.AXIS_Y, Math.PI/2),
            shapes: [{ type: 'sphere', radius: 0.5 }]
        }]
    })
	const ambience = player.visual.elements[3]
	ambience.play()
    
    ZoneGenerator(app, world, player)
    CritterSpawner(app, world, player)
}