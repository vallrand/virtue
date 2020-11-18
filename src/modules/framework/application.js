import {tie, factory} from '../util'
import {EventEmitter} from '../events'

factory.declare('application', target => {
    const ctx = factory.build('gl_context', {manager: target}),
          interaction = factory.build('interaction', {element: ctx.canvas}),
          scene = factory.build('scene', {manager: target}),
          audio = factory.build('audio_context', { scene }),
          physics = factory.build('physics'),
          screen = factory.build('screen'),
          time = factory.build('time')
    
    window.document.body.appendChild(ctx.canvas)
    
    screen.resize.pipe(event => {
        ctx.resize(event.screen.width, event.screen.height)
        scene.camera.resize(event.screen)
    }).fix(e => console.error(e))
    
    screen.focus.pipe(event => {
        audio.pause = !event.focus
    })
    
    time.start().pulse.pipe(event => {
        target.dispatchEvent('update', event.deltaTime)
        physics.update(1/60)
        scene.update(event.deltaTime)
        ctx.render(scene)
    }).fix(e => console.error(e))
    
    return tie({ ctx, audio, screen, time, scene, physics, interaction }, EventEmitter())
})