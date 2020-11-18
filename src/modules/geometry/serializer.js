import {vec3, vec4, quat} from '../math'
import {Plane, Sphere, Cuboid, Cylinder, Polyhedron, transformGeometry} from './csg'

const shapeMapper = {
    'plane': Plane,
    'box': Cuboid,
    'sphere': Sphere,
    'cylinder': Cylinder,
    'convex': Polyhedron
}

//TODO async, use vec3Pool
const deserialize = json => {
    const offset = vec3(0), orientation = quat()
    
    const staticObjects = json.filter(object => !object.mass)
    const solidGeometry = staticObjects.map(object => {
        const position = object.position || vec3.ZERO,
              quaternion = object.quaternion || quat()
        return object.shapes.map(shape => {
            if(!shapeMapper[shape.type]) throw new Error(`Unrecognized shape ${shape.type}`)
            const localOffset = shape.offset || vec3.ZERO,
                  localOrientation = shape.orientation || quat()
            quat.multiply(localOrientation, quaternion, orientation)
            vec3.transformQuat(localOffset, quaternion, offset)
            vec3.add(position, offset, offset)
            return transformGeometry(shapeMapper[shape.type](shape), vertex => {
                //vec3.multiply(vertex, scale, vertex)
                vec3.transformQuat(vertex, orientation, vertex)
                vec3.add(vertex, offset, vertex)
            })
        })
    })
    return solidGeometry
}

export {deserialize, shapeMapper}