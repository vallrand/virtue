export function clipFace(interpolateVertex, vertices, plane, out = []){
    if(!vertices.length) return out
    const size = 0.5 * Math.abs(vec3.dot(vec3.ONE, plane))
    
    function clip(v0, v1){
        let d0 = vec3.dot(v0.position, plane) - size,
            d1 = vec3.dot(v1.position, plane) - size
        return v0.index < v1.index
            ? interpolateVertex(v0, v1, d0 / (d0 - d1))
            : interpolateVertex(v1, v0, d1 / (d1 - d0))
    }
    
    for(let i = 0; i < vertices.length; i+=3){
        let d0 = vec3.dot(vertices[i + 0].position, plane) - size
        let d1 = vec3.dot(vertices[i + 1].position, plane) - size
        let d2 = vec3.dot(vertices[i + 2].position, plane) - size
        
        let v0 = d0 > 0
        let v1 = d1 > 0
        let v2 = d2 > 0
        
        switch(v0 + v1 + v2){
            case 0:
                out.push(vertices[i + 0])
                out.push(vertices[i + 1])
                out.push(vertices[i + 2])
                break
            case 1:
                if(v0){
                    out.push(
                        vertices[i + 1],
                        vertices[i + 2],
                        clip(vertices[i + 0], vertices[i + 1])
                    )
                    out.push(
                        clip(vertices[i + 0], vertices[i + 2]),
                        out[out.length - 1],
                        out[out.length - 2]
                    )
                }else if(v1){
                    out.push(
                        clip(vertices[i + 1], vertices[i + 0]),
                        vertices[i + 2],
                        vertices[i + 0]
                    )
                    out.push(
                        out[out.length - 2],
                        out[out.length - 3],
                        clip(vertices[i + 1], vertices[i + 2])
                    )
                }else if(v2){
                    out.push(
                        vertices[i + 0],
                        vertices[i + 1],
                        clip(vertices[i + 2], vertices[i + 0])
                    )
                    out.push(
                        clip(vertices[i + 2], vertices[i + 1]),
                        out[out.length - 1],
                        out[out.length - 2]
                    )
                }
                break
            case 2:
                if(!v0){
                    out.push(
                        vertices[i + 0],
                        clip(vertices[i + 0], vertices[i + 1]),
                        clip(vertices[i + 0], vertices[i + 2])
                    )
                }else if(!v1){
                    out.push(
                        vertices[i + 1],
                        clip(vertices[i + 1], vertices[i + 2]),
                        clip(vertices[i + 1], vertices[i + 0])
                    )
                }else if(!v2){
                    out.push(
                        vertices[i + 2],
                        clip(vertices[i + 2], vertices[i + 0]),
                        clip(vertices[i + 2], vertices[i + 1])
                    )
                }
                break
            case 3: break
        }
    }
    
    return out
}