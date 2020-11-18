const EventEmitter = _ => {
    const events = Object.create(null)
    
    return {
        addEventListener: (event, listener, once = false) => {
            const listeners = events[event] || (events[event] = [])
            if(listeners.indexOf(listener) !== -1) return false
            if(once) listener.oneTime = true
            listeners.push(listener)
        },
        removeEventListener: (event, listener) => {
            const listeners = events[event] || (events[event] = []),
                  index = listeners.indexOf(listener)
            if(index === -1) return false
            listeners.splice(index, 1)
        },
        removeAllEventListeners: Object.values(events).forEach(listeners => listeners.length = 0),
        dispatchEvent: (event, ...args) => {
            const listeners = events[event]
            if(!listeners) return false
            for(let i = listeners.length - 1; i >= 0; i--)
                if((listeners[i].apply(null, args), listeners[i].oneTime))
                    listeners.splice(i, 1)
        }
    }
}

export {EventEmitter}