import {tie} from '../../../util'
import {vec3, vec4, mat4} from '../../../math'

const approximateParticleSystemRadius = (group, range, samples = 4) => { //TODO include world velocity and acceleration
    let max = 0
    for(let rangeLength = range[1] - range[0], i = 0; i < samples; i++){
        let index = Math.floor(rangeLength * i/samples)
        group.arrayIterator.index = range[0] + index
        let position = group.arrayIterator.position,
            velocity = group.arrayIterator.velocity,
            acceleration = group.arrayIterator.acceleration,
            time = group.arrayIterator.lifeTime
        max = Math.max(max, Math.abs(position[0]) + Math.abs(velocity[0]) + Math.abs(acceleration[0]),
                       Math.abs(position[1]) + Math.abs(velocity[1]) + Math.abs(acceleration[1]),
                       Math.abs(position[2]) + Math.abs(velocity[2]) + Math.abs(acceleration[2]))
    }
    return max
}

const ParticleEmitter = (group, options) => {
    const emitter = Object.create(null),
          material = [options.colorRamp, options.texture],
          attributes = options.emitter

    attributes.timeRange = attributes.timeRange || options.particle.lifeTime
    attributes.frameCount = attributes.frameCount || 1
    attributes.frameDuration = attributes.frameDuration || options.particle.lifeTime / attributes.frameCount
    
    const range = group.allocate(options.count, options.particle)
    let cursor = 0
        
    return tie(emitter, {
        modelMatrix: mat4.identity(),
        static: options.static,
        time: 0,
        radius: approximateParticleSystemRadius(group, range),
        get blendMode(){ return options.blend },
        get instances(){ return options.instances },
        get attributes(){ return attributes },
        get material(){ return material }, //TODO assign instead of getters
        get bufferLength(){ return 6 * options.count },
        get bufferOffset(){ return 6 * range[0] },
        advanceTime: deltaTime => emitter.time += deltaTime,
        emitParticles: (count, transform) => {
            const position = options.particle.position,
                  orientation = options.particle.orientation
            //if(position.applyTransform) position.applyTransform(vec => )
            vec3.translationFromMat4(transform, position) //TODO 
            options.particle.startTime = emitter.time
            
            const limit = range[1] - range[0]
            count = count % limit
            
            if(cursor + count > limit){
                let remaining = limit - cursor
                group.update(range[0] + cursor, remaining, options.particle)
                count -= remaining
                cursor = 0
            }
            group.update(range[0] + cursor, count, options.particle)
            cursor += count
        }
    })
}

export {ParticleEmitter}