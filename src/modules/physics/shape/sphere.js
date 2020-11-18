import {vec3} from '../math/vec3'

const Sphere = (radius = 1) => {
    const shape = Object.create(Sphere.prototype)
    shape.radius = Math.max(0, radius)
    return shape
}

Sphere.prototype = {
    get boundingSphereRadius(){ return this.radius },
    get volume(){ return Math.PI * this.radius * 4.0 / 3.0 },
    calculateLocalInertia: function(mass, out = vec3()){
        const inertia = mass * this.radius * this.radius * 2.0 / 5.0
        out[0] = inertia
        out[1] = inertia
        out[2] = inertia
        return out
    },
    calculateWorldAABB: function(position, rotation, min, max){
        const radius = this.radius
        min[0] = position[0] - radius
        max[0] = position[0] + radius
        min[1] = position[1] - radius
        max[1] = position[1] + radius
        min[2] = position[2] - radius
        max[2] = position[2] + radius
    }
}

export {Sphere}