import {vec3, quat} from '../../math' //TODO wrong place for game logic?

const FlyingCameraController = (camera, interaction) => { //TODO
    return dt => {
    }
}

const WalkingCameraController = (camera, interaction, options) => {
    options = Object.assign({
        initialPosition: vec3(0),
        initialRotation: quat(),
        speedScale: 1,
        walkingPlane: vec3(0, 1, 0)
    }, options || {})
    const movement = vec3(0),
          forward = vec3(),
          left = vec3()
    camera.position = options.initialPosition || vec3.ZERO
    camera.rotation = options.initialRotation || quat()
    
    return dt => {
        const speed = dt * options.speedScale
        
        vec3.copy(vec3.ZERO, movement)
        
        vec3.scale(options.walkingPlane, vec3.dot(camera.forward, options.walkingPlane), forward)
        vec3.subtract(camera.forward, forward, forward)
        vec3.normalize(forward, forward)
        
        vec3.scale(options.walkingPlane, vec3.dot(camera.left, options.walkingPlane), left)
        vec3.subtract(camera.left, left, left)
        vec3.normalize(left, left)
        
        if(interaction.keyboard.getKey('S')) vec3.subtract(movement, forward, movement)
        else if(interaction.keyboard.getKey('W')) vec3.add(movement, forward, movement)

        if(interaction.keyboard.getKey('D')) vec3.subtract(movement, left, movement)
        else if(interaction.keyboard.getKey('A')) vec3.add(movement, left, movement)
        
        vec3.normalize(movement, movement)
        vec3.scale(movement, speed, movement)
        
        //if(interaction.keyboard.getKey('SPACE'))
        
        vec3.add(camera.position, movement, camera.position)
        
        const delta = interaction.mouse.delta
        if(interaction.pointerLocked) camera.rotate(0.01 * delta[0], 0.01 * delta[1])
        
        return movement
    }
}

export {FlyingCameraController, WalkingCameraController}