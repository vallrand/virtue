import {factory, Signal, Stream, unCapitalize} from '../util'


//TODO isn't that more of the device screen functionality? like fullscreen, should be bound to canvas element?
factory.declare('interaction', (target, options) => {
    const prefix = ['', 'ms', 'moz', 'webkit'].find(prefix => (unCapitalize(prefix + 'PointerLockElement') in window.document))
    if(prefix == null) return false
    
    let pointerLocked = false
    
    window.document.addEventListener(prefix + 'pointerlockchange', event => {
        pointerLocked = !pointerLocked
    }, false)
    window.document.addEventListener(prefix + 'pointerlockerror', event => {
        
    }, false)
    //TODO change
    const requestPointerlock = _ => {
        let f = unCapitalize(prefix + 'RequestPointerLock')
        window.document.body[f]()
    }
    //TODO temporary remove 
    window.document.addEventListener('mousedown', event => {
        if(pointerLocked) return
        requestPointerlock()
		event.gesture = 'pointerlock'
    }, false)
    
    return {
        get pointerLocked(){ return pointerLocked }
    }
})