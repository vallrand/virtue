import {tie, factory} from '../../util'
import {vec3, quat, mat4, mat3} from '../../math'
import {BoxGeometry} from '../../geometry'

const WireframeBox = options => Object.assign(BoxGeometry(options), {
    indices: [
        0,1, 1,2, 2,3, 3,0,
        4,5, 5,6, 6,7, 7,4,
        8,9, 9,10, 10,11, 11,8,
        12,13, 13,14, 14,15, 15,12,
        16,17, 17,18, 18,19, 19,16,
        20,21, 21,22, 22,23, 23,20
    ]
})

factory.declare('application', target => {
    if(!target.debugOptions.decals) return false
    const scene = target.scene,
          physics = target.physics
    
    const visual = target.addDebugVisuals([
        WireframeBox({ halfX: 0.5, halfY: 0.5, halfZ: 0.5 })
    ], { color: [0.7, 0.75, 0.8, 1], wireframe: true })

    target.addDebugPass((ctx, render) => {        
        ctx.depthTest = true
        ctx.culling = 'back'
        app.scene.fetchInstancesByGroup('decal').forEach(({ instances }) => instances.forEach(instance => {
            mat4.copy(instance.modelMatrix, visual.modelMatrix)
            render(visual)
        }))
    })
})