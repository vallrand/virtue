import {factory, Signal, Stream} from '../util'

const KEY_BINDINGS = {
    'W': 87,
    'A': 65,
    'S': 83,
    'D': 68,
    
    'UP': 38,
    'DOWN': 40,
    'LEFT': 37,
    'RIGHT': 39,
    
    'CTRL': 17,
    'SPACE': 32
}

factory.declare('interaction', (target, options) => {
    const keys = []
    
    window.addEventListener('keydown', evt => {
        const key = evt.which || evt.keyCode || 0
        keys[key] = true
    })

    window.addEventListener('keyup', evt => {
        const key = evt.which || evt.keyCode || 0
        keys[key] = false
    })
    
    return {
        keyboard: {
            getKey: keyName => keys[KEY_BINDINGS[keyName]]
        }
    }
})

export {KEY_BINDINGS}