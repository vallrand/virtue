import {tie} from '../../util'
//TODO constraints don't work with sleep correctly
const Constraint = (bodyA, bodyB, options) => {
    const target = Object.assign(Object.create(null), {
        collisionResponse: true,
        enabled: true
    }, options || {})
    const equations = []
    
    bodyA.joints.push(target)
    bodyB.joints.push(target)
    
    return tie(target, {
        bodyA, bodyB, equations,
        detach: _ => {
            bodyA.joints.remove(target)
            bodyB.joints.remove(target)
        }
    })
}

export {Constraint}