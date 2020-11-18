import { vec3, vec2 } from '../../math'

export const GridGeometry = ({
    columns = 1,
    rows = 1,
    width = 100,
    height = 100,
    normal = vec3.AXIS_Y
}) => {
    const tangent = vec3(),
          binormal = vec3()
    vec3.extractTangents(normal, tangent, binormal)
    vec3.scale(tangent, width / columns, tangent)
    vec3.scale(binormal, height / rows, binormal)
    
    const vertices = []
    const uvs = []
    const normals = []
    for(let row = 0; row <= rows; row++)
    for(let column = 0; column <= columns; column++){
        vertices.push(vec3(
            tangent[0] * column + binormal[0] * row,
            tangent[1] * column + binormal[1] * row,
            tangent[2] * column + binormal[2] * row
        ))
        uvs.push(vec2(
            column / columns,
            1 - (row / rows)
        ))
        normals.push(normal)
    }
    const indices = []
    for(let row = 0; row < rows; row++)
    for(let column = 0; column < columns; column++){
        const a = (column) + (row) * (columns + 1)
        const b = (column) + (row + 1) * (columns + 1)
        const c = (column + 1) + (row + 1) * (columns + 1)
        const d = (column + 1) + (row) * (columns + 1)

        indices.push(a, b, d)
        indices.push(b, c, d)
    }

    return { vertices, indices, normals, uvs }
}