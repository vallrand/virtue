import {tie, factory} from '../../util'
import {vec3, quat, mat4, mat3} from '../../math'
import {SHAPE_TYPE} from '../../physics/shape'
import {SphereGeometry, PlaneGeometry, BoxGeometry, ConvexPolyhedronGeometry} from '../../geometry'

const shapeGeometry = {
    [SHAPE_TYPE.PLANE]: shape => PlaneGeometry({
        halfWidth: 1e4, 
        halfHeight: 1e4
    }),
    [SHAPE_TYPE.SPHERE]: shape => SphereGeometry({
        radius: shape.radius
    }),
    [SHAPE_TYPE.BOX]: shape => BoxGeometry({
        halfX: shape.halfExtents[0],
        halfY: shape.halfExtents[1],
        halfZ: shape.halfExtents[2]
    }),
    [SHAPE_TYPE.CONVEX]: shape => ConvexPolyhedronGeometry({
        corners: shape.vertices,
        faces: shape.faces
    })
}

factory.declare('application', target => {
    if(!target.debugOptions.physics) return false
    const scene = target.scene,
          physics = target.physics
    
    const visuals = []
    
    physics.addEventListener('bodyAdded', body => {
        if(!body.visual) return false
        const mesh = target.addDebugVisuals(body.shapes.map((shape, idx) => {
            const geometry = shapeGeometry[shape.type](shape),
                  offset = body.shapeOffsets[idx],
                  orientation = body.shapeOrientations[idx]
            geometry.normals.forEach(normal => vec3.transformQuat(normal, orientation, normal))
            geometry.vertices.forEach(vertex => vec3.add(vec3.transformQuat(vertex, orientation, vertex), offset, vertex))
            return geometry
        }), { color: vec3(0.5, 0.5, 0.5), position: body.position, quaternion: body.quaternion })
        visuals.push([body, mesh])
    })
    
    physics.addEventListener('bodyRemoved', body => {
        let idx = visuals.findIndex(pair => pair[0] === body)
        if(idx == -1) return false
        let mesh = visuals[idx][1]
        visuals.splice(idx, 1)
        target.removeDebugVisuals(mesh)
    })
    
    physics.addEventListener('postStep', _ => {
        for(let i = visuals.length - 1; i >= 0; i--){
            let visual = visuals[i][1],
                imposter = visuals[i][0]
            vec3.copy(imposter.dynamic ? [0.5, 0.5, 0.5] : [0.2, 0.2, 0.2], visual.color)
            vec3.copy(imposter.position, visual.position)
            quat.copy(imposter.quaternion, visual.quaternion)
            mat4.fromRotationTranslationScale(visual.quaternion, visual.position, vec3.ONE, visual.modelMatrix)
        }
    })
    
    target.addDebugPass((ctx, render) => {
        ctx.depthTest = true
        ctx.culling = 'back'
        visuals.forEach(pair => render(pair[1]))
    })
    
})