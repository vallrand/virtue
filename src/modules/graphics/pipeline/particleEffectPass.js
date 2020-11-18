import {logger} from '../../debug/logger'
import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {vec3, mat3, quat, mat4} from '../../math'

import {generateParticleTexture, RangeSampler, ColorRamp} from '../effects'

//TODO move to lib
const billboarded_particle = {
    //TODO reorganize?
    vert: vglsl.createShader()
    //TODO change names
    .attribute('vec4', 'uvLifeTimeFrameStart')
    .attribute('vec4', 'positionStartTime')
    .attribute('vec4', 'velocityStartSize')
    .attribute('vec4', 'accelerationEndSize')
    .attribute('vec4', 'spinStartSpinSpeed')
    .attribute('vec4', 'colorMult')
    
    .varying('vec2', 'uvPass')
    .varying('float', 'percentLifePass')
    .varying('vec4', 'colorPass')
    
    .uniform('mat4', 'viewProjectionMatrix')
    .uniform('mat4', 'invViewMatrix')
    .uniform('mat4', 'modelMatrix') //TODO do we need it? modelMatrix?
    
    .uniform('vec3', 'worldVelocity')
    .uniform('vec3', 'worldAcceleration')
    .uniform('float', 'timeRange')
    .uniform('float', 'time')
    .uniform('float', 'frameDuration')
    .uniform('float', 'frameCount')
    
    .main([
        //TODO separate param extracting?
        'vec2 uv = uvLifeTimeFrameStart.xy;',
        'float lifeTime = uvLifeTimeFrameStart.z;',
        'float frameStart = uvLifeTimeFrameStart.w;',
        'vec3 position = positionStartTime.xyz;',
        'float startTime = positionStartTime.w;',
        'vec3 velocity = (modelMatrix * vec4(velocityStartSize.xyz, 0.0)).xyz + worldVelocity;', //TODO operations later? (since separation)
        'float startSize = velocityStartSize.w;',
        'vec3 acceleration = (modelMatrix * vec4(accelerationEndSize.xyz, 0)).xyz + worldAcceleration;',
        'float endSize = accelerationEndSize.w;',
        'float spinStart = spinStartSpinSpeed.x;',
        'float spinSpeed = spinStartSpinSpeed.y;',
        
        'float localTime = mod((time - startTime), timeRange);',
        'float percentLife = localTime / lifeTime;',
        'float frame = mod(floor(localTime / frameDuration + frameStart), frameCount);',
        'float uOffset = frame / frameCount;',
        'float u = uOffset + (uv.x + 0.5) * (1. / frameCount);',
        
        'vec3 basisX = invViewMatrix[0].xyz;',
        'vec3 basisZ = invViewMatrix[1].xyz;',
        'float size = mix(startSize, endSize, percentLife);',
        'size = (percentLife < 0. || percentLife > 1.) ? 0. : size;',
        'float s = sin(spinStart + spinSpeed * localTime);',
        'float c = cos(spinStart + spinSpeed * localTime);',
        'vec2 rotatedPoint = vec2(uv.x * c + uv.y * s, -uv.x * s + uv.y * c);',
        'vec3 localPosition = vec3(basisX * rotatedPoint.x + basisZ * rotatedPoint.y) * size + velocity * localTime + acceleration * localTime * localTime + position;',
        
        'uvPass = vec2(u, uv.y + 0.5);',
        'colorPass = colorMult;',
        'percentLifePass = percentLife;',
        
        'gl_Position = viewProjectionMatrix * vec4(localPosition + modelMatrix[3].xyz, 1.);'
    ]),
    frag: vglsl.createShader()
    .uniform('sampler2D', 'rampSampler')
    .uniform('sampler2D', 'textureAtlas')
    
    .varying('vec2', 'uvPass')
    .varying('float', 'percentLifePass')
    .varying('vec4', 'colorPass')
    
    .main([
        'vec4 color = texture2D(rampSampler, vec2(percentLifePass, 0.5)) * colorPass;', //TODO should clamp uv-s somehow? -0.5 of tex size
        'gl_FragColor = texture2D(textureAtlas, uvPass) * color;'
    ])
}

const oriented_particle = {
    vert: vglsl.createShader()
    //TODO rename reorganize
    .attribute('vec4', 'uvLifeTimeFrameStart')
    .attribute('vec4', 'positionStartTime')
    .attribute('vec4', 'velocityStartSize')
    .attribute('vec4', 'accelerationEndSize')
    .attribute('vec4', 'spinStartSpinSpeed')
    .attribute('vec4', 'orientation')
    .attribute('vec4', 'colorMult')
    
    .varying('vec2', 'uvPass')
    .varying('float', 'percentLifePass')
    .varying('vec4', 'colorPass')
    
    .uniform('mat4', 'viewProjectionMatrix')
    .uniform('mat4', 'modelMatrix')
    
    .uniform('vec3', 'worldVelocity')
    .uniform('vec3', 'worldAcceleration')
    .uniform('float', 'timeRange')
    .uniform('float', 'time')
    .uniform('float', 'frameDuration')
    .uniform('float', 'frameCount')
    
    .main([
        'vec2 uv = uvLifeTimeFrameStart.xy;',
        'float lifeTime = uvLifeTimeFrameStart.z;',
        'float frameStart = uvLifeTimeFrameStart.w;',
        'vec3 position = positionStartTime.xyz;',
        'float startTime = positionStartTime.w;',
        'vec3 velocity = (modelMatrix * vec4(velocityStartSize.xyz, 0.0)).xyz + worldVelocity;', //TODO do we need to multiply? it should be in world coords already
        'float startSize = velocityStartSize.w;',
        'vec3 acceleration = (modelMatrix * vec4(accelerationEndSize.xyz, 0)).xyz + worldAcceleration;',
        'float endSize = accelerationEndSize.w;',
        'float spinStart = spinStartSpinSpeed.x;',
        'float spinSpeed = spinStartSpinSpeed.y;',
        
        'float localTime = mod((time - startTime), timeRange);',
        'float percentLife = localTime / lifeTime;',
        'float frame = mod(floor(localTime / frameDuration + frameStart), frameCount);',
        'float uOffset = frame / frameCount;',
        'float u = uOffset + (uv.x + 0.5) * (1. / frameCount);',
        'float size = mix(startSize, endSize, percentLife);',
        'size = (percentLife < 0. || percentLife > 1.) ? 0. : size;',
        'float s = sin(spinStart + spinSpeed * localTime);',
        'float c = cos(spinStart + spinSpeed * localTime);',
        'vec4 rotatedPoint = vec4((uv.x * c + uv.y * s) * size, 0., (uv.x * s - uv.y * c) * size, 1.);',
        'vec3 center = velocity * localTime + acceleration * localTime * localTime + position;',
        
        'vec4 q2 = orientation + orientation;',
        'vec4 qx = orientation.xxxw * q2.xyzx;',
        'vec4 qy = orientation.xyyw * q2.xyzy;',
        'vec4 qz = orientation.xxzw * q2.xxzz;',
        'mat4 localMatrix = mat4((1.0 - qy.y) - qz.z, qx.y + qz.w, qx.z - qy.w, 0,',
        'qx.y - qz.w, (1.0 - qx.x) - qz.z, qy.z + qx.w, 0,',
        'qx.z + qy.w, qy.z - qx.w, (1.0 - qx.x) - qy.y, 0,',
        'center.x, center.y, center.z, 1);',
        'rotatedPoint = localMatrix * rotatedPoint;',
        
        'uvPass = vec2(u, uv.y + 0.5);',
        'colorPass = colorMult;',
        'percentLifePass = percentLife;',
        
        'gl_Position = viewProjectionMatrix * modelMatrix * rotatedPoint;'
    ]),
    frag: vglsl.createShader()
    .uniform('sampler2D', 'rampSampler')
    .uniform('sampler2D', 'textureAtlas')
    
    .varying('vec2', 'uvPass')
    .varying('float', 'percentLifePass')
    .varying('vec4', 'colorPass')
    
    .main([
        'vec4 color = texture2D(rampSampler, vec2(percentLifePass, 0.5)) * colorPass;', //TODO should clamp uv-s somehow? -0.5 of tex size
        'gl_FragColor = texture2D(textureAtlas, uvPass) * color;'
    ])
}



////TODO common code here
//const particle_system = {
//    vert: vglsl.createShader(),
//    frag: vglsl.createShader()
//}

const ParticleEffectPass = (ctx, scene, options = {}) => {
    const gl = ctx.gl,
          particleSystems = {
              billboarded: ctx.registerParticleSystem({
                  attributeFormat: [
                      //TODO rename, reorganize
                      { type: 'uvLifeTimeFrameStart', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'positionStartTime', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'velocityStartSize', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'accelerationEndSize', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'spinStartSpinSpeed', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'orientation', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'colorMult', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT }
                  ],
                  bufferFormat: [ //TODO correct defaults?
                      ['lifeTime', 0], ['frameStart', 0],
                      ['position', [0, 0, 0]], ['startTime', 0],
                      ['velocity', [0, 0, 0]], ['startSize', 0],
                      ['acceleration', [0, 0, 0]], ['endSize', 0],
                      ['spinStart', 0], ['spinSpeed', 0], [null, [0, 0]],
                      ['orientation', [0, 0, 0, 0]],
                      ['color', [0, 0, 0, 0]]
                  ],
                  limit: 1024,
                  shaderSrc: billboarded_particle
              }),
              oriented: ctx.registerParticleSystem({
                  attributeFormat: [
                      { type: 'uvLifeTimeFrameStart', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'positionStartTime', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'velocityStartSize', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'accelerationEndSize', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'spinStartSpinSpeed', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'orientation', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT },
                      { type: 'colorMult', size: 4, byteSize: Float32Array.BYTES_PER_ELEMENT } //TODO array.map?
                  ],
                  bufferFormat: [
                      ['lifeTime', 0], ['frameStart', 0],
                      ['position', [0, 0, 0]], ['startTime', 0],
                      ['velocity', [0, 0, 0]], ['startSize', 0],
                      ['acceleration', [0, 0, 0]], ['endSize', 0],
                      ['spinStart', 0], ['spinSpeed', 0], [null, [0, 0]],
                      ['orientation', [0, 0, 0, 0]],
                      ['color', [0, 0, 0, 0]]
                  ],
                  limit: 1024,
                  shaderSrc: oriented_particle
              })
          }
    let defaultParticleTexture = { loaded: true, data: ctx.generateTexture(generateParticleTexture()) },
        defaultColorRamp = { loaded: true, data: ctx.generateTexture(ColorRamp([1,1,1,1],[0,0,0,0])) } //TODO lazy init?
    
    
    scene.addEventListener('particle_emitter', (instance, emitter) => {
        if(emitter.delegate) return true
        logger.info('fx', `Initializing ParticleSystem ${emitter.group} "${emitter.name}".`)
        emitter.texture = emitter.texture || defaultParticleTexture
        emitter.colorRamp = emitter.colorRamp ? { loaded: true, data: ctx.generateTexture(ColorRamp(...emitter.colorRamp)) } : defaultColorRamp
        emitter.delegate = particleSystems[emitter.group].group.createEmitter(emitter)
    })
    
    return (ctx, scene, next, frame) => {
        ctx.depthMask = false
        ctx.culling = false
        
        const viewProjectionMatrix = scene.camera.viewProjectionMatrix,
              invViewMatrix = mat4.invert(scene.camera.viewMatrix, mat4())
        //TODO sorting?
        ctx.particleSystems.forEach(particleSystem => {
            let { shader, vao, group } = particleSystem
            group.syncBufferData()
            vao.bind()
            shader.use()
            shader.uao.viewProjectionMatrix = viewProjectionMatrix
            shader.uao.invViewMatrix = invViewMatrix
            
            group.emitters.forEach(emitter => {
                ctx.blendMode = emitter.blendMode
                shader.uao.autowire(emitter.attributes)
                ctx.bindTextures(emitter.material)
                if(emitter.static)
                    emitter.instances.forEach(instance => {
                        if(!scene.camera.frustumCulling(instance)) return false
                        
                        shader.uao.modelMatrix = instance.modelMatrix
                        shader.uao.time = instance.time
                        shader.uao.update()
                        ctx.drawElements(emitter.bufferLength, emitter.bufferOffset)
                    })
                else{
                    shader.uao.modelMatrix = emitter.modelMatrix
                    shader.uao.time = emitter.time
                    shader.uao.update()
                    ctx.drawElements(emitter.bufferLength, emitter.bufferOffset)
                }
            })
            
        })
        ctx.depthMask = true //TODO should be elsewhere?
        ctx.blendMode = false
        ctx.culling = 'back'
        next()
    }
}

export {ParticleEffectPass}