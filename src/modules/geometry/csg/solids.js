import {vec2, vec3} from '../../math'

const transformGeometry = (geometry, transform) => { //TODO optional taskManager param?
    const vertices = geometry.vertices
    for(let i = vertices.length - 1; i >= 0; i--)
        transform.call(geometry, vertices[i])
    return geometry
}

const Plane = ({
    dimensions = vec2(1e3)
} = {}) => {

    const vertices = Array.range(4).map(i => vec3( //TODO X, Z plane? change pysics plane to use Y up axis as default
        dimensions[0] * (i & 1 ? 0.5 : -0.5),
        dimensions[1] * (i & 2 ? 0.5 : -0.5), 0
    )), faces = [[0,1,3,2]]
    
    return { vertices, faces }
}

const Sphere = ({
    wedges = 16,
    rings = 8,
    radius = 1
} = {}) => {
    
    const thetaAngle = 2 * Math.PI / wedges,
          phiAngle = Math.PI / rings,
          vertices = [],
          faces = [],
          indices = Array.range(rings + 1)
    .map(y => Array.range(y == 0 || y == rings || wedges)
         .map(x => {
              let theta = x * thetaAngle,
                  phi = y * phiAngle,
                  normal = vec3(Math.cos(theta) * Math.sin(phi),
                                Math.cos(phi),
                                Math.sin(theta) * Math.sin(phi))
              return vertices.push(vec3.scale(normal, radius, normal)) - 1
          }))

    for(let y = 0; y < rings; y++)
        for(let x = 0; x < wedges; x++)
            faces.push(y == 0 && [
                indices[y + 1][x], indices[y][0], indices[y + 1][(x + 1) % wedges]
            ] || y == rings - 1 && [
                indices[y + 1][0], indices[y][x], indices[y][(x + 1) % wedges]
            ] || [
                indices[y + 1][x], indices[y][x], indices[y][(x + 1) % wedges], indices[y + 1][(x + 1) % wedges]
            ])
    
    return { vertices, faces }
}

const Cuboid = ({
    halfExtents = vec3.ONE
} = {}) => {
    const vertices = Array.range(8).map(idx => vec3(
        idx & 1 ? halfExtents[0] : -halfExtents[0],
        idx & 2 ? halfExtents[1] : -halfExtents[1],
        idx & 4 ? halfExtents[2] : -halfExtents[2]
    )), faces = [[0, 4, 6, 2],
                 [1, 3, 7, 5],
                 [0, 1, 5, 4],
                 [2, 6, 7, 3],
                 [0, 2, 3, 1],
                 [4, 5, 7, 6]]
    return { vertices, faces }
}

const Cylinder = ({
    segments = 16,
    height = 1,
    radius = 1
} = {}) => {
    
    const thetaAngle = 2 * Math.PI / segments,
          vertices = [],
          faces = []
    let top = [],
        bottom = []
    
    for(let i = 0, j = segments - 1; i < segments; j = i++){
        let theta = thetaAngle * i,
            x = Math.sin(theta) * radius,
            z = Math.cos(theta) * radius
        //TODO fix axis. use Y by default (change physics cylinder as well!!!)
        //vertices.push(vec3(x, 0.5 * height, z), vec3(x, -0.5 * height, z))   
        vertices.push(vec3(z, x, 0.5 * height), vec3(z, x, -0.5 * height))
        faces.push([2*j, 2*j + 1, 2*i + 1, 2*i])
        top.push(2*i)
        bottom.push(2*i + 1)
    }
    faces.push(top, bottom.reverse())
    
    return { vertices, faces }
}

const Polyhedron = ({ vertices, faces }) => ({
    vertices: vertices.map(vertex => vec3.copy(vertex)),
    faces: faces.map(face => face.slice())
})

export {Plane, Sphere, Cuboid, Cylinder, Polyhedron, transformGeometry}