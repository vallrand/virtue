import {vec3, vec2} from '../../math'

const BoxGeometry = ({ //TODO reorder vertices and faces
    halfX = 10,
    halfY = 10,
    halfZ = 10
}) => {
    const vertices = [
        vec3( halfX, halfY, halfZ), vec3(-halfX, halfY, halfZ), vec3(-halfX,-halfY, halfZ), vec3( halfX,-halfY, halfZ),
        vec3( halfX, halfY, halfZ), vec3( halfX,-halfY, halfZ), vec3( halfX,-halfY,-halfZ), vec3( halfX, halfY,-halfZ),
        vec3( halfX, halfY, halfZ), vec3( halfX, halfY,-halfZ), vec3(-halfX, halfY,-halfZ), vec3(-halfX, halfY, halfZ),
        vec3(-halfX, halfY, halfZ), vec3(-halfX, halfY,-halfZ), vec3(-halfX,-halfY,-halfZ), vec3(-halfX,-halfY, halfZ),
        vec3(-halfX,-halfY,-halfZ), vec3( halfX,-halfY,-halfZ), vec3( halfX,-halfY, halfZ), vec3(-halfX,-halfY, halfZ),
        vec3( halfX,-halfY,-halfZ), vec3(-halfX,-halfY,-halfZ), vec3(-halfX, halfY,-halfZ), vec3( halfX, halfY,-halfZ)],
          indices = [0, 1, 2,   0, 2, 3,
                     4, 5, 6,   4, 6, 7,
                     8, 9,10,   8,10,11,
                     12,13,14,  12,14,15,
                     16,17,18,  16,18,19,
                     20,21,22,  20,22,23],
          normals = [vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
                     vec3(1, 0, 0), vec3(1, 0, 0), vec3(1, 0, 0), vec3(1, 0, 0),
                     vec3(0, 1, 0), vec3(0, 1, 0), vec3(0, 1, 0), vec3(0, 1, 0),
                     vec3(-1, 0, 0), vec3(-1, 0, 0), vec3(-1, 0, 0), vec3(-1, 0, 0),
                     vec3( 0,-1, 0), vec3(0 ,-1, 0), vec3(0, -1, 0), vec3(0,- 1, 0),
                     vec3( 0, 0,-1), vec3(0,  0,-1), vec3(0, 0 ,-1), vec3(0, 0,- 1)],
          uvs = [
              vec2(1,0), vec2(0,0), vec2(0,1), vec2(1,1),
              vec2(1,0), vec2(1,1), vec2(0,0), vec2(0,1),
              vec2(1,0), vec2(0,1), vec2(1,1), vec2(0,0),
              vec2(0,0), vec2(1,1), vec2(1,0), vec2(0,1),
              vec2(1,0), vec2(0,0), vec2(1,1), vec2(0,1),
              vec2(0,0), vec2(1,0), vec2(1,1), vec2(0,1)]
    
    return { vertices, indices, normals, uvs }
}

export {BoxGeometry}