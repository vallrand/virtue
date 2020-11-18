import {tie} from '../../util'
import {vec2, vec3, vec4, mat3, mat4, Ray} from '../structs'

const Raycaster = _ => {
    const target = Object.create(null)
    return tie(target, {
        
    })
}

Raycaster.fromCamera = (camera, mouseCoords) => {//TODO optimise by calculating bound rays and interpolating direction
    const ray = Ray.fromProjectionCamera(camera, mouseCoords)
    
    return {
        intersect: entity => { //TODO handle intersection for different objects
            //TODO better way to get world bounding sphere, since it might be inside container
            return Ray.sphereIntersection(ray, { center: vec3.translationFromMat4(entity.modelMatrix), radius: entity.boundingSphereRadius })
        },
        get ray(){ return ray }
    }
}

export {Raycaster}