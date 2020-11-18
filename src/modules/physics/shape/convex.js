import {vec3} from '../math/vec3'
import {quat} from '../math/quat'
import {Transform} from '../math/transform'

import {aquireVec3Pool} from '../math'

const ConvexPolyhedron = (vertices, faces, uniqueAxes) => {
    const shape = Object.create(ConvexPolyhedron.prototype)
    const vec3Pool = aquireVec3Pool()
    
    
    const faceNormals = Array(faces.length),
          edge0 = vec3Pool.obtain(),
          edge1 = vec3Pool.obtain()
    for(let i = faces.length - 1; i >= 0; i--){
        let face = faces[i],
            faceNormal = faceNormals[i] = vec3(),
            a = vertices[face[0]],
            b = vertices[face[1]],
            c = vertices[face[2]]
        vec3.subtract(b, a, edge0)
        vec3.subtract(c, b, edge1)
        vec3.cross(edge1, edge0, faceNormal)
        vec3.normalize(faceNormal, faceNormal)
        vec3.negate(faceNormal, faceNormal)
        if(vec3.dot(faceNormal, a) < 0) throw new Error('Face vertices should be ordered CCW!')
    }
    
    const uniqueEdges = []
    for(let i = 0; i < faces.length; i++){
        let face = faces[i]
        face_iteration: for(let j = 0; j < face.length; j++){
            let k = (j + 1) % face.length
            vec3.subtract(vertices[face[j]], vertices[face[k]], edge0)
            vec3.normalize(edge0, edge0)
            
            for(let l = 0; l < uniqueEdges.length; l++)
                if(vec3.equals(uniqueEdges[l], edge0)) //TODO invert check is missing
                    continue face_iteration
            
            uniqueEdges.push(vec3.copy(edge0))
        }
    }
    
    let maxSquared = 0
    for(let i = vertices.length - 1; i >= 0; i--){
        let distanceSquared = vec3.distanceSquared(vertices[i])
        if(maxSquared < distanceSquared) maxSquared = distanceSquared
    }
    let boundingSphereRadius = Math.sqrt(maxSquared) //TODO recalc on change?
    
    vec3Pool.release()
    //TODO auto generate unique axes
    return Object.assign(shape, {
        vertices, faces, uniqueAxes, faceNormals, uniqueEdges, boundingSphereRadius
    })
}

ConvexPolyhedron.prototype = {
    calculateWorldAABB: function(position, rotation, min, max){
        const temp = vec3.temp,
              vertices = this.vertices
        vec3.copy(vec3.MAX, min)
        vec3.copy(vec3.MIN, max)
        for(let i = vertices.length - 1; i >= 0; i--){
            vec3.transformQuat(vertices[i], rotation, temp)
            vec3.add(temp, position, temp)
            vec3.min(min, temp, min)
            vec3.max(max, temp, max)
        }
    },
    get volume(){ return 4.0 / 3.0 * Math.PI * this.boundingSphereRadius },
    calculateLocalInertia: function(mass, out = vec3()){
        const vertices = this.vertices,
              vertexCount = vertices.length,
              m = mass / 3.0
        let dx = 0, dy = 0, dz = 0
        for(let i = vertexCount - 1; i >= 0; i--){
            let vertex = vertices[i]
            dx += vertex[0] * vertex[0]
            dy += vertex[1] * vertex[1]
            dz += vertex[2] * vertex[2]
        }
        dx = 2 * Math.sqrt(2 * dx / vertexCount)
        dy = 2 * Math.sqrt(2 * dy / vertexCount)
        dz = 2 * Math.sqrt(2 * dz / vertexCount)
        out[0] = (dy + dz) * m
        out[1] = (dx + dz) * m
        out[2] = (dx + dy) * m
        return out
    },
    transformAllPoints: function(offset, quaternion){ //TODO rename to applyTransform
        for(let i = this.faceNormals.length - 1; i >= 0; i--)
            vec3.transformQuat(this.faceNormals[i], quaternion, this.faceNormals[i])
        for(let i = this.uniqueEdges.length - 1; i >= 0; i--)
            vec3.transformQuat(this.uniqueEdges[i], quaternion, this.uniqueEdges[i])
        for(let i = this.vertices.length - 1; i >= 0; i--){
            let vertex = this.vertices[i]
            vec3.transformQuat(vertex, quaternion, vertex)
            vec3.add(vertex, offset, vertex)
        }
    }
}

export {ConvexPolyhedron}