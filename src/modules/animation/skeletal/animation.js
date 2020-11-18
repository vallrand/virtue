import {factory, tie, Stream} from '../../util'
import {mat3, mat4, vec3, vec4, quat, dualquat} from '../../math'

factory.declare('animation', (target, options) => {
    const DQS = options.dualQuatSkinning,
          layers = options.layers.map(bones => bones.map(frames => factory.build('timeline', {frames, dualQuatSkinning: DQS}))),
          duration = layers.map(timelines => timelines.reduce((duration, timeline) => Math.max(duration, timeline.duration), 0)),
          accPosition = vec3(), accRotation = quat(),
          frameTransform = !DQS ? mat4.identity() : dualquat()
    return {
        getLayerLength: layer => duration[layer],
        sample: !DQS ? (boneId, mixer) => {
            if(mixer.length === 1){
                const clip = mixer[0],
                      clipDuration = duration[clip.layer],
                      sampler = layers[clip.layer][boneId]
                if(!sampler) return false
                const frame = sampler.sample(clip.crop(clipDuration))
                return mat4.fromRotationTranslationScale(frame.rotation, frame.position, [1,1,1], frameTransform)
            }else if(mixer.length > 1){
                vec3.copy([0, 0, 0], accPosition)
                vec4.copy([0, 0, 0, 0], accRotation)
                mixer.forEach(clip => {
                    const clipDuration = duration[clip.layer],
                          frame = layers[clip.layer][boneId].sample(clip.crop(clipDuration)), //TODO if sampler is not existant?
                          framePosition = frame.position,
                          frameRotation = frame.rotation,
                          weight = clip.weight || 0
                    accPosition[0] += weight * framePosition[0]
                    accPosition[1] += weight * framePosition[1]
                    accPosition[2] += weight * framePosition[2]

                    accRotation[0] += weight * frameRotation[0]
                    accRotation[1] += weight * frameRotation[1]
                    accRotation[2] += weight * frameRotation[2]
                    accRotation[3] += weight * frameRotation[3]
                })
                return mat4.fromRotationTranslationScale(accRotation, accPosition, [1,1,1], frameTransform)
            }
        } : (boneId, mixer) => {
            if(mixer.length === 1){
                const clip = mixer[0],
                      clipDuration = duration[clip.layer],
                      sampler = layers[clip.layer][boneId]
                if(!sampler) return false
                const frame = sampler.sample(clip.crop(clipDuration))
                return dualquat.copy(frame.transform, frameTransform)
            }else if(mixer.length > 1){
                dualquat.copy([0, 0, 0, 0, 0, 0, 0, 0], frameTransform)
                mixer.forEach(clip => {
                    const clipDuration = duration[clip.layer],
                          frame = layers[clip.layer][boneId].sample(clip.crop(clipDuration)), //TODO if sampler is not existant?
                          transform = frame.transform,
                          weight = clip.weight || 0
                    frameTransform[0] += weight * transform[0]
                    frameTransform[1] += weight * transform[1]
                    frameTransform[2] += weight * transform[2]
                    frameTransform[3] += weight * transform[3]
                    frameTransform[4] += weight * transform[4]
                    frameTransform[5] += weight * transform[5]
                    frameTransform[6] += weight * transform[6]
                    frameTransform[7] += weight * transform[7]
                })
                return frameTransform
            }
        }
    }
})