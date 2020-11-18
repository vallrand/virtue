import {factory, tie} from '../util'

factory.declare('gl_context', (target, options) => {
    const ctxOptions = tie({ //TODO evaluate performance
        alpha: false,
        depth: true,
        stencil: false,
        antialias: false,
        premultipliedAlpha: true,
        //preserveDrawingBuffer: true
    }, options.canvasOptions || {}),
          canvas = window.document.createElement('canvas'),
          gl = canvas.getContext('webgl', ctxOptions) || canvas.getContext('experimental-webgl', ctxOptions),
          pipeline = factory.build('pipeline')
    
    canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault()
    }, false)
    
    canvas.addEventListener('webglcontextrestored', event => null, false) //TODO handle restoring context?
    
    canvas.addEventListener('contextmenu', event => {
        event.preventDefault()
        event.stopPropagation()
    }, false)
    
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clearDepth(1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
	return {
        canvas, gl, pipeline,
		resize: (width, height) => {
			canvas.width = width
			canvas.height = height
			target.resetViewport()
		},
        resetViewport: _ => target.viewport = [canvas.width, canvas.height],
        render: scene => {
            gl.clear(gl.DEPTH_BUFFER_BIT)
            return pipeline.run(target, scene)
        },
        drawElements: (size, offset) => gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, Uint16Array.BYTES_PER_ELEMENT * offset),
        drawArrays: (size, offset) => gl.drawArrays(gl.TRIANGLES, offset, size)
	}
})