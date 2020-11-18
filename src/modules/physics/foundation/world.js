import {tie, factory} from '../../util'
import {OverlapMatrix} from './overlapMatrix'

factory.declare('physics', (target, options) => {
    const bodies = [],
          constraints = [],
          overlapMatrix = OverlapMatrix()
    
    return {
        overlapMatrix,
        bodies, constraints,
        addConstraint: constraint => constraints.push(constraint),
        removeConstraint: constraint => {
            let idx = constraints.indexOf(constraint)
            if(idx == -1) return false
            constraints.splice(idx, 1)
            constraint.detach()
        },
        addBody: body => {
            if(!isNaN(body.index)) return false
            body.index = bodies.length
            bodies.push(body)
            
            target.dispatchEvent('bodyAdded', body)
            return body
        },
        removeBody: body => {
            delete body.index
            
            let idx = bodies.indexOf(body)
            if(idx === -1) return false
            bodies.splice(idx, 1)
            for(let i = bodies.length - 1; i >= idx; i--)
                bodies[i].index = i //TODO overlap matrix is outdated here...
                
            target.dispatchEvent('bodyRemoved', body)
        }
    }
})