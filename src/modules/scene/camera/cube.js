import {factory, tie, Stream} from '../../util'
import {mat3, mat4, vec3, vec4, quat, frustum} from '../../math'

factory.declare('cube:camera', (target, options) => {
    const cameras = [{
        up: [0, -1, 0],
        forward: [1, 0, 0]
    }, {
        up: [0, -1, 0],
        forward: [-1, 0, 0]
    }, {
        up: [0, 0, 1],
        forward: [0, 1, 0]
    }, {
        up: [0, 0, -1],
        forward: [0, -1, 0]
    }, {
        up: [0, -1, 0],
        forward: [0, 0, 1]
    }, {
        up: [0, -1, 0],
        forward: [0, 0, -1]
    }].map(options => factory.build('perspective:camera', tie({
        fovy: 0.5 * Math.PI,
        aspectRatio: 1
    }, options)))
    
	return {
        cube: true,
        faces: cameras,
        get zFar(){ return cameras[0].zFar },
        set zFar(value){ for(let i = cameras.length - 1; i >= 0; cameras[i--].zFar = value); },
        get zNear(){ return cameras[0].zNear },
        set zNear(value){ for(let i = cameras.length - 1; i >= 0; cameras[i--].zNear = value); },
        get position(){ return cameras[0].position },
        set position(value){ for(let i = cameras.length - 1; i >= 0; cameras[i--].position = value); }
	}
})