import {tie, factory} from '../../util'
import {EventEmitter} from '../../events'
import {vec3, quat} from '../math'

factory.declare('physics', (target, options) => {
    
    const simulationEvent = {
        deltaTime: 0.0,
        time: 0.0,
        frame: 0
    }
    
    let time = 0.0,
        timeRemaining = 0.0
    
    return tie({
        update: (elapsedTime, minDeltaTime, maxSubSteps = 10) => {
            if(!minDeltaTime){
                target.step(elapsedTime)
                return time += elapsedTime
            }
            
            timeRemaining += elapsedTime
            let substeps = 0
            while(timeRemaining >= minDeltaTime && substeps < maxSubSteps){
                timeRemaining -= minDeltaTime
                target.step(minDeltaTime)
                time += minDeltaTime
                substeps++
            }
            let f = (timeRemaining % minDeltaTime) / minDeltaTime
            for(let i = target.bodies.length - 1; i >= 0; i--){
                let body = target.bodies[i]
                vec3.lerp(body.previousPosition, body.position, f, body.interpolatedPosition)
                quat.slerp(body.previousQuaternion, body.quaternion, f, body.interpolatedQuaternion)
                quat.normalize(body.interpolatedQuaternion, body.interpolatedQuaternion)
            }
            return time
        },
        get frame(){ return simulationEvent.frame },
        step: deltaTime => {
            simulationEvent.frame++
            simulationEvent.time = time
            simulationEvent.deltaTime = deltaTime
            target.simulate(simulationEvent)
        }
    }, EventEmitter())
})