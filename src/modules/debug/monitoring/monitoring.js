import {factory} from '../../util'
import {MonitoringToolkit} from './toolkit'

const sharedData = {
    drawCalls: 0,
    ms: []
}

factory.declare('gl_context', target => ({ 
    drawElements: (_ => ++sharedData.drawCalls).extend(target.drawElements),
    drawArrays: (_ => ++sharedData.drawCalls).extend(target.drawArrays),
    render: (base => (...args) => {
        sharedData.ms[0] = window.performance.now()
        const out = base(...args)
        out.listen(_ => sharedData.ms[0] = window.performance.now() - sharedData.ms[0], null, false)
        return out
    })(target.render)
}))

factory.declare('pipeline', target => {
    const drawCalls = []
    let passId = 0
    
    return {
        run: (_ => drawCalls.length = passId = 0).extend(target.run),
        get drawCalls(){ return drawCalls },
        pass: (base => callable => base((ctx, scene, next, ...args) => callable(ctx, scene, (_ => {
            drawCalls[passId++] = sharedData.drawCalls
            sharedData.drawCalls = 0
        }).extend(next), ...args)))(target.pass)
    }
})

factory.declare('scene', target => ({
    update: (base => (...args) => {
        sharedData.ms[2] = window.performance.now()
        const out = base(...args)
        sharedData.ms[2] = window.performance.now() - sharedData.ms[2]
        return out
    })(target.update)
}))

factory.declare('application', target => {
    //if(!target.debugOptions.monitor) return false
    const monitoring = MonitoringToolkit(),
          frameEvent = {
              drawCalls: target.ctx.pipeline.drawCalls,
              tasks: 0,
              ms: sharedData.ms
          }
    
    target.physics.addEventListener('preStep', _ => sharedData.ms[1] = window.performance.now())
    target.physics.addEventListener('postStep', _ => sharedData.ms[1] = window.performance.now() - sharedData.ms[1])
    
    target.time.pulse.attach(event => {
        frameEvent.tasks = target.tasks.length
        monitoring.captureFrame(frameEvent)
    }, null, false)
})