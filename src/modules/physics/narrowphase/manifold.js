import {vec3} from '../math/vec3'
import {quat} from '../math/quat'
import {Pool} from '../../util'

const ContactManifold = _ => ({
    contactNormal: vec3(),
    contactPointA: vec3(),
    contactPointB: vec3()
})

const ManifoldContext = _ => {
    const contactPool = Pool(ContactManifold),
          context = Object.create(null)
    
    return Object.assign(context, {
        flip: false,
        material: null,
        bodyA: null,
        bodyB: null,
        shapeA: null,
        shapeB: null,
        worldPositionA: vec3(),
        worldPositionB: vec3(),
        worldRotationA: quat(),
        worldRotationB: quat(),
        contactPoints: [],
        contactNormal: vec3(),
        contactPointA: vec3(),
        contactPointB: vec3(),
        clear: _ => {
            if(context.contactPoints.length == 0) return false
            contactPool.release.apply(contactPool, context.contactPoints)
            context.contactPoints.length = 0
        },
        registerContact: _ => {
            const contact = contactPool.obtain()
            if(context.flip){
                vec3.negate(context.contactNormal, contact.contactNormal)
                vec3.subtract(context.contactPointB, context.bodyA.position, contact.contactPointA)  
                vec3.subtract(context.contactPointA, context.bodyB.position, contact.contactPointB)
            }else{
                vec3.copy(context.contactNormal, contact.contactNormal)
                vec3.subtract(context.contactPointA, context.bodyA.position, contact.contactPointA)  
                vec3.subtract(context.contactPointB, context.bodyB.position, contact.contactPointB)
            }            
            context.contactPoints.push(contact)
            return contact
        }
    })
}

export {ContactManifold, ManifoldContext}