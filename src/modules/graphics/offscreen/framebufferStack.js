import {logger} from '../../debug/logger'
import {factory, tie} from '../../util'

factory.declare('gl_context', (target, options) => {
    const gl = target.gl,
          FBOs = []
    let totalMemoryUsage = 0
    
    return {
        returnFramebuffer: (framebuffer) => {
            framebuffer.inUse = false
        },
        pollFramebuffer: (width, height = width) => {
            let fboIdx = FBOs.findIndex(fbo => fbo.width === width && fbo.height === height && !fbo.inUse)
            if(fboIdx > -1) return FBOs[fboIdx]
            
            totalMemoryUsage += width * height
            let fbo = factory.build('fbo', {ctx: target, width: width, height: height})
                
            logger.info('memory', `Allocating framebuffer (${FBOs.length}) size [${width},${height}]. Total: ${totalMemoryUsage}`)
            return FBOs[FBOs.length] = tie(fbo, { inUse: true, return: target.returnFramebuffer.bind(target, fbo).once() })
        }
    }
})