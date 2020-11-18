import {factory, tie, Stream} from '../../util'
import {mat3, mat4, vec3, vec4, quat, dualquat, greatestCommonDivisor} from '../../math'

const TIME_RESOLUTION = 1e3

factory.declare('timeline', (target, options) => {
    const DQS = options.dualQuatSkinning,
          frames = !DQS ? options.frames : options.frames.map(frame => Object.assign(frame, {transform: dualquat.fromRotationTranslation(frame.rotation, frame.position)})),
          startTime = frames[0].time,
          endTime = frames[frames.length - 1].time,
		  minInterval = Array.range(frames.length - 1)
		  .map(idx => frames[idx+1].time - frames[idx].time)
		  .map(duration => Math.floor(duration * TIME_RESOLUTION))
		  .reduce(greatestCommonDivisor) / TIME_RESOLUTION,
          pointerArray = new Uint16Array(minInterval ? Math.floor((endTime-startTime)/minInterval) + 1 : 0),
          interpolatedFrame = !DQS ? {position: vec3(), rotation: quat()} : {transform: dualquat()}
    for(let p = 0, i = 0; p < pointerArray.length && i < frames.length; frames[i].time-startTime > (p+0.5)*minInterval ? pointerArray[++p] = i - 1 : pointerArray[p] = Math.min(frames.length - 2, i++));
    
    return {
        sample: !DQS ? time => {
            if(time < startTime || minInterval === 0) return frames[0]
            if(time > endTime) return frames[frames.length - 1]
            
            const frameIdx = pointerArray[Math.floor((time-startTime)/minInterval)],
                  frame = frames[frameIdx],
                  nextFrame = frames[frameIdx+1],
                  factor = (time - frame.time)/(nextFrame.time - frame.time)
            vec3.lerp(frame.position, nextFrame.position, factor, interpolatedFrame.position)
            quat.slerp(frame.rotation, nextFrame.rotation, factor, interpolatedFrame.rotation)
            return interpolatedFrame
        } : time => {
            if(time < startTime || minInterval === 0) return frames[0]
            if(time > endTime) return frames[frames.length - 1]
            const frameIdx = pointerArray[Math.floor((time-startTime)/minInterval)],
                  frame = frames[frameIdx],
                  nextFrame = frames[frameIdx+1],
                  factor = (time - frame.time)/(nextFrame.time - frame.time)
            dualquat.lerp(frame.transform, nextFrame.transform, factor, interpolatedFrame.transform)
            return interpolatedFrame
        },
        get duration(){ return endTime }
    }
})