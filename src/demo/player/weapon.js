import {vec3, quat} from '../../modules/math'

export const Weapon = world => ({
	use(position, velocity){
		const projectile = world.addEntity({
			visual: {
				className: 'instance',
				nodes: [{
					className: 'emitter', type: 'projectile', timeOffset: 0, position: [0, 0, 0], frequency: 0.4
				}]
			},
			behavior: [entity => {
				vec3.scale(velocity, -20, velocity)
				vec3.copy(velocity, entity.imposter[0].velocity)
				let lifespan = 5000
				return {
					update: deltaTime => {
						lifespan -= deltaTime
						if(lifespan < 0) world.removeEntity(projectile)
					},
					synchronize: () => (entity.visual.position = entity.imposter[0].position),
					clear: () => {}
				}
			}],
			imposter: [{
				material: 'playerMaterial',
				mass: 1,
				position: vec3.copy(position),
				quaternion: quat(0,0,0,1),
				shapes: [{ type: 'sphere', radius: 0.5 }]
			}]
		})
	}
})