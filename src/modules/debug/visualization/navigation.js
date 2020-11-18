import {tie, factory} from '../../util'
import {vec3, quat, mat4, mat3} from '../../math'
import {ConvexPolyhedronGeometry} from '../../geometry'

factory.declare('application', target => {
    if(!target.debugOptions.navigation) return false
    const scene = target.scene,
          physics = target.physics
    const offset = vec3(0, 0, 0)
    
    let navigationWireframe = null
    let navigationMesh = null
    
    scene.addEventListener('navigation', navigationMeshGeometry => {        
        if(navigationWireframe) target.removeDebugVisuals(navigationWireframe)
        const wireframeGeometry = navigationMeshGeometry.groups.map(group => ({
            vertices: group.vertices,
            normals: Array(group.vertices.length).fill(vec3.AXIS_Y),
            indices: group.polygons.map(polygon => {
                let indices = []
                for(let i = polygon.indices.length - 1, j = 0; i >= 0; j = i--)
                    indices.push(polygon.indices[i], polygon.indices[j])
                return indices
            }).flatten()
        }))
        navigationWireframe = target.addDebugVisuals(wireframeGeometry, { color: [0.0, 0.7, 0.4], wireframe: true, position: offset })
        
        
        if(navigationMesh) target.removeDebugVisuals(navigationMesh)
        const geometry = navigationMeshGeometry.groups.map(group => ConvexPolyhedronGeometry({
            corners: group.vertices,
            faces: group.polygons.map(polygon => polygon.indices),
            faceNormals: group.polygons.map(polygon => polygon.normal)
        }))
        navigationMesh = target.addDebugVisuals(geometry, { color: [0.0, 0.2, 0.0], position: offset })
    })
    
    target.addDebugPass((ctx, render) => {
        if(!navigationWireframe || !navigationMesh) return false 
        ctx.depthTest = true
        ctx.culling = false
        render(navigationWireframe)
        
        ctx.blendMode = 'add'
        render(navigationMesh)
    })
})