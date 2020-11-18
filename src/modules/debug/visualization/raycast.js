import {tie, factory} from '../../util'
import {vec3, quat, mat4, mat3} from '../../math'
import {BoxGeometry} from '../../geometry'

factory.declare('application', target => {
    if(!target.debugOptions.raycast) return false
    const scene = target.scene,
          physics = target.physics
    
    const visual = target.addDebugVisuals([
        BoxGeometry({ halfX: 0.5, halfY: 0.5, halfZ: 0.5 })
    ], { color: [1, 0, 0], position: [0, 0, 0], quaternion: [0, 0, 0, 1] })

    scene.addEventListener('update', function(){
        const origin = app.scene.camera.position
        const target = vec3.add(origin, vec3.scale(app.scene.camera.forward, 1000))
        const ray = V.physics.Ray(origin, target)
        const result = physics.raycast(ray, { skipBackFaces: true, nearest: true })

        if(result[0])
            visual.position = result[0].intersectionPoint

        mat4.fromRotationTranslationScale(visual.quaternion, visual.position, vec3.ONE, visual.modelMatrix)
    })

    target.addDebugPass((ctx, render) => {        
        ctx.depthTest = true
        ctx.culling = 'back'
        render(visual)
    })
})