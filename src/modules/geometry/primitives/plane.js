import {vec3, vec2} from '../../math'

const PlaneGeometry = ({
    halfWidth = 1e4,
    halfHeight = 1e4,
    normal = vec3.AXIS_Z
}) => {
    const tangent = vec3(),
          binormal = vec3()
    vec3.extractTangents(normal, tangent, binormal)
    vec3.scale(tangent, halfWidth, tangent)
    vec3.scale(binormal, halfHeight, binormal)
    const vertices = [vec3.add(tangent, binormal),
                      vec3.subtract(binormal, tangent),
                      vec3.negate(vec3.add(tangent, binormal)),
                      vec3.subtract(tangent, binormal)],
          indices = [0, 1, 2, 0, 2, 3],
          normals = Array(4).fill(normal),
          uvs = [vec2(0, 0),
                 vec2(1, 0),
                 vec2(1, 1),
                 vec2(0, 1)]
    return { vertices, indices, normals, uvs }
}

export {PlaneGeometry}