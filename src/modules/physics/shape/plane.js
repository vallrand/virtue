import {vec3} from '../math/vec3'

const Plane = () => { //TODO plane should have width/height 
    const shape = Object.create(Plane.prototype)
    shape.worldNormal = vec3.copy(vec3.AXIS_Z)
    return shape
}

Plane.prototype = {
    get boundingSphereRadius(){ return Number.MAX_VALUE },
    get volume(){ return Number.MAX_VALUE },
    calculateLocalInertia: function(mass, out = vec3()){ return out },
    calculateWorldAABB: function(position, rotation, min, max){
        const normal = vec3.temp
        vec3.transformQuat(this.worldNormal, rotation, normal)
        vec3.copy(vec3.MIN, min)
        vec3.copy(vec3.MAX, max)
        
        if(normal[0] == 1) max[0] = position[0]
        if(normal[1] == 1) max[1] = position[1]
        if(normal[2] == 1) max[2] = position[2]
        if(normal[0] == -1) min[0] = position[0]
        if(normal[1] == -1) min[1] = position[1]
        if(normal[2] == -1) min[2] = position[2]
    }
}

export {Plane}