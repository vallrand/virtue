import { RigidBody, materialLibrary } from './foundation'
import { Box, ConvexPolyhedron, Cylinder, Plane, Sphere } from './shape'

const serializer = world => {
    //TODO
}

export const shapeMapper = {
    'plane': options => Plane(),
    'box': options => Box(options.halfExtents),
    'sphere': options => Sphere(options.radius),
    'convex': options => ConvexPolyhedron(options.vertices, options.faces),
    'cylinder': options => Cylinder(options.radius, options.radius, options.height, options.segments)
}

export const deserialize = json => json.map(bodyParameters => {
    const { shapes, material } = bodyParameters

    const body = RigidBody(Object.assign(Object.create(null), bodyParameters, {
        material: materialLibrary[material]
    }))
    shapes.forEach(shape => {
        if(!shapeMapper[shape.type]) throw new Error(`Unrecognized shape ${shape.type}`)
        const shapeGeometry = shapeMapper[shape.type](shape)
        body.addShape(shapeGeometry, shape.offset, shape.orientation)
    })
    return body
})