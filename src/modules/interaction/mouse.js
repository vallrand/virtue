import {factory, Signal, Stream} from '../util'
import {vec2} from '../math'

const MOUSE = {
    LEFT_CLICK: 0,
    MIDDLE_CLICK: 1,
    RIGHT_CLICK: 2
}

factory.declare('interaction', (target, options) => { //TODO event propagation
    const capture = options.capture || window,
          position = vec2(),
          prevPosition = vec2(),
          mouseState = []
    
    capture.addEventListener('mousedown', event => {
		if(event.gesture) return
        mouseState[event.button] = true
    })
    
    capture.addEventListener('mouseup', event => {
        mouseState[event.button] = false
    })
    
    capture.addEventListener('mousemove', event => {
        //const mousePosition = vec2(evt.offsetX, evt.offsetY),
        //      direction = vec2.subtract(mousePosition, position)
        //move.onSuccess({direction})
        
        if(target.pointerLocked){
            let sensitivity = 0.5
            position[0] += sensitivity * (event.movementX || event.mozMovementX || event.webkitMovementX || 0)
            position[1] += sensitivity * (event.movementY || event.mozMovementY || event.webkitMovementY || 0)
        }else{
            position[0] = event.clientX //offsetX
            position[1] = event.clientY
        }
    })
    
    capture.addEventListener('mousewheel', event => {
        event.preventDefault()
        event.stopPropagation()
    }, { passive: false })   

    return {
        mouse: {
            get position(){
                const screenSpaceCoords = vec2.copy(position)
                screenSpaceCoords[0] = (screenSpaceCoords[0] / window.innerWidth) * 2 - 1 //use capture width/height?
                screenSpaceCoords[1] = -(screenSpaceCoords[1] / window.innerHeight) * 2 + 1
                return screenSpaceCoords
            },
            get left(){ return mouseState[MOUSE.LEFT_CLICK] },
            get middle(){ return mouseState[MOUSE.MIDDLE_CLICK] },
            get right(){ return mouseState[MOUSE.RIGHT_CLICK] },
            get hold(){ return mouseState[MOUSE.LEFT_CLICK] },//TODO remove
            get delta(){
                const direction = vec2.subtract(position, prevPosition)
                vec2.copy(position, prevPosition)
                return direction
            }
        }
    }
})