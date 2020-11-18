import {WalkingCameraController} from '../../modules/debug'
import {vec3, quat} from '../../modules/math'
import {Ray, RigidBody, Spring} from '../../modules/physics'


const GroundPin = (target, physics, options) => {
    options = Object.assign({
        detachThreshold: 5,
        rayLength: 1e2
    }, options || {})
    
    const rayTarget = vec3()
    const rayNormal = vec3.copy(vec3.AXIS_Y)
    
    let pinned = false
    let ground = null
    const pin = RigidBody({
        mass: 0,
        position: vec3.copy(target.position),
        quaternion: quat()
    })
    
    const spring = Spring(target, pin, {
        restLength: 1,
        stiffness: 1e4,
        damping: 1e3
    })
    
    function hitTestGround(){
        const { contactEquations } = physics.narrowphase
        const normal = vec3()
        vec3.negate(vec3.AXIS_Y, normal)
        for(let minY = Infinity, i = contactEquations.length - 1; i >= 0; i--){
            let { bodyA, bodyB, contactPointA, contactPointB, contactNormal } = contactEquations[i]

            if(bodyA === target && contactPointA[1] < minY){
                minY = contactPointA[1]
                vec3.negate(contactNormal, normal)
                ground = bodyB
            }else if(bodyB === target && contactPointB[1] < minY){
                minY = contactPointB[1]
                vec3.copy(contactNormal, normal)
                ground = bodyA
            }
        }
        let dot = vec3.dot(vec3.AXIS_Y, normal)
        return dot > 0
    }
    
    return {
        normal: rayNormal,
        position: pin.position,
        get ground(){ return ground },
        get pinned(){ return pinned },
        detach(){
            pinned = false
            physics.subsystems.remove(spring)
        },
        update(deltaTime){
            vec3.scale(vec3.AXIS_Y, -options.rayLength, rayTarget)
            vec3.add(target.position, rayTarget, rayTarget)
            const ray = Ray(target.position, rayTarget)
            const [ rayIntersection ] = physics.raycast(ray, { skipBackFaces: true, nearest: true })
            
            if(rayIntersection){
                const { intersectionPoint, intersectionNormal } = rayIntersection
                vec3.copy(intersectionNormal, rayNormal)
                vec3.copy(intersectionPoint, pin.position)
            }
            
            const grounded = hitTestGround()
            
            if(!pinned && grounded){
                pinned = true
                physics.subsystems.push(spring)
            }else if(pinned && vec3.difference(ray.origin, pin.position) > options.detachThreshold){
                pinned = false
                physics.subsystems.remove(spring)
            }
            
        }
    }
}

const Player = (camera, interaction, app, handlers) => entity => { //TODO remove app dependency
    const imposter = entity.imposter[0],
          visual = entity.visual,
          floorNormal = vec3(0, 1, 0),
          processCameraMovement = WalkingCameraController(camera, interaction, { walkingPlane: floorNormal }),
          groundPin = GroundPin(imposter, app.physics),
          cameraOffset = vec3(0, 0.8, 0)
    camera.rotation = quat.conjugate(imposter.quaternion)
    
    const footsteps = {
        timeElapsed: 0,
        concrete: visual.elements[1],
        metal: visual.elements[2],
        playing: null
    }
    
    return {
        update: (deltaTime, updateContext) => {
            groundPin.update(deltaTime)
            vec3.copy(groundPin.normal, floorNormal)
            let direction = processCameraMovement(deltaTime) //TODO change to be more generic (movement speed etc) (that will also fix vibration floating point error caused one)
            vec3.scale(direction, 0.16, direction)
            
            vec3.add(groundPin.position, direction, groundPin.position)
            
            if(groundPin.pinned){
                vec3.copy(vec3.ZERO, imposter.velocity)
            }else{
                imposter.velocity[0] = direction[0]
                imposter.velocity[2] = direction[2]
            }
            
            if(!vec3.equals(direction, vec3.ZERO) && groundPin.ground){
                const cover = groundPin.ground.cover
                if(footsteps.playing != cover){
                    if(footsteps.playing) footsteps[footsteps.playing].stop()
                    footsteps.playing = cover
                    if(footsteps[footsteps.playing]) footsteps[footsteps.playing].play()
                }
                footsteps.timeElapsed += deltaTime
            }else if(footsteps.playing){
                footsteps[footsteps.playing].stop()
                footsteps.playing = null
                footsteps.timeElapsed = 0
            }
            
            
            //TODO attach to ground?
            //imposter.velocity[1] = Math.min(0, imposter.velocity[1])
            
            if(interaction.mouse.left && !visual.elements[0].animationClip.length){
                visual.elements[0].insertClip(0, 1, 1)
				const origin = vec3.add(imposter.position, cameraOffset)
				const direction = vec3.transformQuat(vec3.AXIS_Z, visual.rotation)
                handlers.weapon.use(vec3.add(origin, vec3.scale(direction, -0.5)), direction)
                visual.elements[4].play()
            }
            
            //if(interaction.keyboard.getKey('SPACE')){
            //    //imposter.velocity[1] += 46
            //    imposter.position[1] += 1
            //    groundPin.detach()
            //}
        },
        synchronize: _ => {
            camera.position = vec3.add(imposter.position, cameraOffset, vec3.temp)
            
            visual.position = camera.position
            visual.position[1] += 0.012 * Math.sin(0.01 * footsteps.timeElapsed)
            visual.rotation = quat.conjugate(camera.rotation, quat.temp)
        },
        clear: _ => {
            //TODO
        }
    }
}

export {Player}