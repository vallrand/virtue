import {EventEmitter} from '../../events'
import {vec3, quat, mat3, Transform, AABB} from '../math'

const RigidBody = options => {
    const body = Object.assign(Object.create(RigidBody.prototype), {
        mass: 0,
        linearDamping: 1e-1,
        angularDamping: 1e-1,
        linearFactor: vec3(1, 1, 1),
        angularFactor: vec3(1, 1, 1),
        position: vec3(),
        quaternion: quat(),
        fixedRotation: false
    }, options || {})
    
    body.vlambda = vec3()
    body.wlambda = vec3()
    
    body.velocity = vec3()
    body.angularVelocity = vec3()
    body.force = vec3()
    body.torque = vec3()
    
    body.invMass = body.mass ? 1.0 / body.mass : 0
    
    body.previousPosition = vec3.copy(body.position)
    body.interpolatedPosition = vec3.copy(body.position)

    body.previousQuaternion = quat.copy(body.quaternion)
    body.interpolatedQuaternion = quat.copy(body.quaternion)
    
    body.shapes = []
    body.shapeOffsets = []
    body.shapeOrientations = []
    
    body.inertia = vec3()
    body.cachedInvInertia = vec3()
    body.cachedInvInertia.dirty = true
    body.cachedInvInertiaWorld = mat3()
    body.cachedInvInertiaWorld.dirty = true
    
    body.worldAABB = AABB()
    body.worldAABB.dirty = true
    
    body.combinedBoundingRadius = 0
    
    body.joints = []
    
    return Object.assign(body, EventEmitter())
}

RigidBody.prototype = {
    tempVec3: vec3(),
    tempQuat: quat(),
    tempAABB: AABB(),
    get dynamic(){ return !!this.mass },
    addShape: function(shape, offset = vec3(), orientation = quat()){
        this.shapes.push(shape)
        this.shapeOffsets.push(offset)
        this.shapeOrientations.push(orientation)
        
        this.combinedBoundingRadius = 0
        this.worldAABB.dirty = true
        this.cachedInvInertiaWorld.dirty = true
        return this
    },
    removeShape: function(shape){
        let idx = this.shapes.indexOf(shape)
        if(idx == -1) return false
        this.shapes.splice(idx, 1)
        this.shapeOffsets.splice(idx, 1)
        this.shapeOrientations.splice(idx, 1)
        
        this.combinedBoundingRadius = 0
        this.worldAABB.dirty = true
        this.cachedInvInertiaWorld.dirty = true
        return this
    },
    get boundingSphereRadius(){
        if(this.combinedBoundingRadius) return this.combinedBoundingRadius
        
        for(let i = this.shapes.length - 1; i >= 0; i--){
            let radius = vec3.distance(this.shapeOffsets[i]) + this.shapes[i].boundingSphereRadius
            if(radius > this.combinedBoundingRadius)
                this.combinedBoundingRadius = radius
        }
        return this.combinedBoundingRadius
    },
    get aabb(){
        if(!this.worldAABB.dirty) return this.worldAABB
        
        const aabb = this.worldAABB,
              worldPosition = this.tempVec3,
              worldRotation = this.tempQuat,
              shapeAABB = this.tempAABB
        
        vec3.copy(vec3.MAX, aabb.lowerBound)
        vec3.copy(vec3.MIN, aabb.upperBound)
        
        for(let i = this.shapes.length - 1; i >= 0; i--){
            let shape = this.shapes[i]
            
            vec3.transformQuat(this.shapeOffsets[i], this.quaternion, worldPosition)
            vec3.add(worldPosition, this.position, worldPosition)
            
            quat.multiply(this.shapeOrientations[i], this.quaternion, worldRotation)
            
            shape.calculateWorldAABB(worldPosition, worldRotation, shapeAABB.lowerBound, shapeAABB.upperBound)
            AABB.extend(shapeAABB, aabb, aabb)
        }
        
        aabb.dirty = false
        return aabb
    },
    get invInertia(){
        if(!this.cachedInvInertia.dirty) return this.cachedInvInertia
        const inertia = this.inertia,
              invInertia = this.cachedInvInertia,
              fixedRotation = this.fixedRotation,
              shapeInertia = this.tempVec3
        
        vec3.copy(vec3.ZERO, inertia)
        for(let i = this.shapes.length - 1; i >= 0; i--){
            this.shapes[i].calculateLocalInertia(this.mass, shapeInertia)
            vec3.transformQuat(shapeInertia, this.shapeOrientations[i], shapeInertia)
            vec3.add(shapeInertia, this.shapeOffsets[i], shapeInertia)
            vec3.add(inertia, shapeInertia, inertia)
        }
        //TODO setter for fixed rotation set dirty flag to inertia
        vec3.set(inertia[0] > 0 && !fixedRotation ? 1.0 / inertia[0] : 0,
                 inertia[1] > 0 && !fixedRotation ? 1.0 / inertia[1] : 0,
                 inertia[2] > 0 && !fixedRotation ? 1.0 / inertia[2] : 0, invInertia)
        
        invInertia.dirty = false
        return invInertia
    },
    get invInertiaWorld(){
        if(!this.cachedInvInertiaWorld.dirty) return this.cachedInvInertiaWorld

        const invInertia = this.invInertia,
              invInertiaWorld = this.cachedInvInertiaWorld
        
        let temp = mat3.fromQuat(this.quaternion, mat3.temp) //TODO optimise
        mat3.transpose(temp, invInertiaWorld)
        mat3.scale(temp, invInertia, temp)
        mat3.multiply(temp, invInertiaWorld, invInertiaWorld)
        
        invInertiaWorld.dirty = false
        return invInertiaWorld
    },
    applyForce: function(force, relativePoint){
        if(!this.dynamic) return false
        vec3.add(this.force, force, this.force)
        const angularForce = vec3.cross(relativePoint, force, vec3.temp)
        vec3.add(this.torque, angularForce, this.torque)
    },
    applyImpulse: function(impulse, relativePoint){
        if(!this.dynamic) return false
        const temp = vec3.temp,
              invInertiaWorld = this.invInertiaWorld
        
        vec3.scale(impulse, this.invMass, temp)
        vec3.add(this.velocity, temp, this.velocity)
        
        vec3.cross(relativePoint, impulse, temp)
        vec3.transformMat3(temp, invInertiaWorld, temp)
        this.invInertiaWorld.vmult(temp, temp)
        vec3.add(this.angularVelocity, temp, this.angularVelocity)
    },
    applyLocalForce: function(force, point){
        if(!this.dynamic) return false
        Transform.vectorToWorldFrame(force, this.position, this.quaternion, force)
        Transform.pointToWorldFrame(point, this.position, this.quaternion, point)
        return this.applyForce(force, point)
    },
    applyLocalImpulse: function(impulse, point){
        if(!this.dynamic) return false
        Transform.vectorToWorldFrame(impulse, this.position, this.quaternion, impulse)
        Transform.pointToWorldFrame(point, this.position, this.quaternion, point)
        return this.applyImpulse(impulse, point)
    },
    getVelocityAtWorldPoint: function(worldPoint, out = vec3()){
        vec3.subtract(worldPoint, this.position, out)
        vec3.cross(this.angularVelocity, out, out)
        vec3.add(this.velocity, out, out)
        return out
    }
}

export {RigidBody}