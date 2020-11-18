import {tie, factory} from '../../util'
import {vec3, quat, mat4, mat3} from '../../math'
import {BoxGeometry} from '../../geometry'

factory.declare('application', target => {
    if(!target.debugOptions.lights) return false
    const scene = target.scene,
          physics = target.physics
    
    const visuals = []
    
    scene.addEventListener('light', light => {
        if(!light.position) return
        //TODO  rotate for spotlights, etc
        const mesh = target.addDebugVisuals([
            BoxGeometry({ halfX: 0.2, halfY: 0.2, halfZ: 0.2 })
        ], { color: light.color, position: light.camera.position, quaternion: quat() })
        
        light.onCleanup(function(){
            target.removeDebugVisuals(mesh)
            const index = visuals.findIndex(pair => pair[0] === light)
            if(index != -1) visuals.splice(index, 1)
        })
        visuals.push([light, mesh])
    })
    
    //TODO clear when light is removed
    
    scene.addEventListener('update', function(){
        for(let i = visuals.length - 1; i >= 0; i--){
            let visual = visuals[i][1],
                imposter = visuals[i][0]
            vec3.copy(imposter.color, visual.color)
            vec3.copy(imposter.camera.position, visual.position)
            mat4.fromRotationTranslationScale(visual.quaternion, visual.position, vec3.ONE, visual.modelMatrix)
        }
    })
    
    target.addDebugPass((ctx, render) => {        
        ctx.depthTest = true
        ctx.culling = 'back'
        visuals.forEach(pair => render(pair[1]))
    })
})