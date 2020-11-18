import {vec3} from '../math/vec3'
import {ConvexPolyhedron} from './convex'

const Cylinder = (topRadius, bottomRadius, height, segments = 8) => {
    const vertices = [],
          faces = [],
          axes = [],
          topFace = [],
          bottomFace = [],
          segmentAngle = 2 * Math.PI / segments
    
    for(let i = 0; i < segments; i++){
        let theta = segmentAngle * i,
            j = (i+1) % segments
        vertices.push(vec3(bottomRadius * Math.cos(theta),
                              bottomRadius * Math.sin(theta),
                              -0.5 * height))
        vertices.push(vec3(topRadius * Math.cos(theta),
                              topRadius * Math.sin(theta),
                              0.5 * height))
        bottomFace.unshift(2*i)
        topFace.push(2*i+1)
        faces.push([2*j, 2*j+1, 2*i+1, 2*i])
    }
    faces.push(topFace)
    faces.push(bottomFace)
    
    axes.push(vec3.copy(vec3.AXIS_Z))
    for(let i = 0, uniqueAxes = segments % 2 ? segments/2 : segments; i < uniqueAxes; i++){
        let theta = segmentAngle * (i + 0.5)
        axes.push(vec3(Math.cos(theta), Math.sin(theta), 0))
    }    
    return ConvexPolyhedron(vertices, faces, axes)
}

export {Cylinder}
