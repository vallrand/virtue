import {vec3, vec2} from '../../math'

const SphereGeometry = ({
    radius = 10, 
    widthSegments = 8, 
    heightSegments = 6, 
    phi = 2 * Math.PI, 
    theta = Math.PI, 
    phiOffset = 0, 
    thetaOffset = 0
}) => {
    
    const vertices = [],
          indices = [],
          normals = [],
          uvs = []
    
    for(let y = 0; y <= heightSegments; y++){
        let stepY = y / heightSegments
        for(let x = 0; x <= widthSegments; x++){
            let stepX = x / widthSegments
            let vertex = vec3(radius * -Math.cos(phiOffset + stepX * phi) * Math.sin(thetaOffset + stepY * theta),
                              radius * Math.cos(thetaOffset + stepY * theta),
                              radius * Math.sin(phiOffset + stepX * phi) * Math.sin(thetaOffset + stepY * theta))
            vertices.push(vertex)
            normals.push(vec3.normalize(vertex))
            uvs.push(vec2(stepX, 1 - stepY))
            
            if(y == heightSegments || x == widthSegments) continue
            let a = (y) * (widthSegments+1) + (x + 1),
                b = (y) * (widthSegments+1) + (x),
                c = (y + 1) * (widthSegments+1) + (x),
                d = (y + 1) * (widthSegments+1) + (x + 1)
            if(y > 0 || thetaOffset > 0) indices.push(a, b, d)
            if(y < heightSegments || thetaOffset + theta < Math.PI) indices.push(b, c, d)
        }
    }
    return { vertices, indices, normals, uvs }
}

export {SphereGeometry}