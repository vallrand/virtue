import {vec3, vec2} from '../../math'

//TODO move to math
const azimuth = v => Math.atan2(v[2], -v[0])
const inclination = v => Math.atan2(-v[1], Math.sqrt(v[0]*v[0] + v[2]*v[2]))

const ConvexPolyhedronGeometry = ({
    corners, faces, faceNormals
}) => {
    let vertices = [],
        indices = [],
        normals = [],
        uvs = []
    
    faces.map(face => face.map(index => vec3.copy(corners[index])))
    .forEach((face, faceIdx) => {        
        let faceNormal = faceNormals ? faceNormals[faceIdx] : vec3.faceNormal(face[0], face[1], face[2]) //TODO remove colinear points?
        vec3.normalize(faceNormal, faceNormal)
        let offset = vertices.length,
            faceUvs = face.map(vertex => vec2(
            0.5 * azimuth(vertex) / Math.PI + 0.5,
            1 - inclination(vertex) / Math.PI + 0.5))
        vertices.push(...face)
        normals.push(...Array(face.length).fill(faceNormal))
        Array.range(face.length - 2).forEach(index => {
            let centroid = vec3.add(vec3.add(face[0], face[index+1]), face[index+2])
            vec3.scale(centroid, 1/3, centroid)
            let centroidAzimuth = azimuth(centroid)
            ;[0, index+1, index+2].forEach(idx => {
                let uv = faceUvs[idx]
                if(centroidAzimuth < 0 && uv[0] == 1) uv[0] = uv[0] - 1
                if(face[idx][0] == 0 && face[idx][2] == 2) uv[0] = 0.5 * centroidAzimuth / Math.PI + 0.5
            })
            indices.push(offset, offset + index + 1, offset + index + 2)
        })
        uvs.push(...faceUvs)
    })
    
    return { vertices, indices, normals, uvs }
}

export {ConvexPolyhedronGeometry}