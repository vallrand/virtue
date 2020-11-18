import {tie, factory} from '../../util'
import {vec3} from '../math'
import {RigidBody} from './rigidBody'

Object.defineProperty(RigidBody.prototype, 'dynamic', {
    get: (base => function(){
        if(this.sleeping) return false
        return base.call(this)
    })(Object.getOwnPropertyDescriptor(RigidBody.prototype, 'dynamic').get)
})

factory.declare('physics', (target, options) => {
    options = Object.assign({
        allowSleep: !true,
        sleepSpeedLimit: 0.1,
        sleepTimeLimit: 1
    }, options || {})
    
    if(!options.allowSleep) return false
    
    const wakeUp = body => {
        body.sleeping = false
        body.sleepTimer = options.sleepTimeLimit
        for(let i = body.joints.length - 1; i >= 0; i--){
            let joint = body.joints[i]
            if(!joint.awakeConnected) continue
            let oppositeBody = joint.bodyA === body ? joint.bodyB : joint.bodyA
            if(oppositeBody.sleeping)
            wakeUp(oppositeBody)
        }
        //body.dispatchEvent('woke up') //TODO uncomment to add events
    }
    
    const putToSleep = body => {
        //TODO add iteration check for joints?
        body.sleeping = true
        vec3.copy(vec3.ZERO, body.velocity)
        vec3.copy(vec3.ZERO, body.angularVelocity)
        //body.dispatchEvent('fell asleep') //TODO uncomment to add events
    }
    
    target.addEventListener('bodyAdded', body => {
        body.sleepTimer = options.sleepTimeLimit
    })
    
    target.addEventListener('collision', event => {
        const bodyA = event.bodyA,
              bodyB = event.bodyB,
              speedLimitSquared = 2 * options.sleepSpeedLimit * options.sleepSpeedLimit
        
        if(bodyA.sleeping && bodyB.dynamic && !bodyB.sleeping){
            let speedSquared = vec3.distanceSquared(bodyB.velocity) + vec3.distanceSquared(bodyB.angularVelocity)
            if(speedSquared >= speedLimitSquared)
                bodyA.wakeUpFlag = true
        }
        
        if(bodyB.sleeping && bodyA.dynamic && !bodyA.sleeping){
            let speedSquared = vec3.distanceSquared(bodyA.velocity) + vec3.distanceSquared(bodyA.angularVelocity)
            if(speedSquared >= speedLimitSquared)
                bodyB.wakeUpFlag = true
        }
    })
    
    target.addEventListener('preSolve', event => {
        for(let i = target.bodies.length - 1; i >= 0; i--){
            let body = target.bodies[i]
            if(!body.wakeUpFlag) continue
            wakeUp(body)
            body.wakeUpFlag = false
        }
    })
    
    target.addEventListener('postStep', event => {
        const deltaTime = event.deltaTime,
              speedLimitSquared = 2 * options.sleepSpeedLimit * options.sleepSpeedLimit
        
        for(let i = target.bodies.length - 1; i >= 0; i--){
            let body = target.bodies[i]
            if(!body.dynamic && !body.sleeping) continue
            let speedSquared = vec3.distanceSquared(body.velocity) + vec3.distanceSquared(body.angularVelocity)
            if(body.sleeping && speedSquared > speedLimitSquared)
                wakeUp(body)
            else if(!body.sleeping)
                if(speedSquared >= speedLimitSquared)
                    body.sleepTimer = options.sleepTimeLimit
                else if((body.sleepTimer -= deltaTime) <= 0)
                    putToSleep(body)
        }
    })
    
    return {}
})