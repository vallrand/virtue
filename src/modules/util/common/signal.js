import {tie} from './factory'
import {defer} from './worker'

const Signal = executor => {
    const signal = Object.create(Signal.prototype)
    signal.status = Signal.PENDING
    if(executor)
        executor(signal.onSuccess.bind(signal), signal.onError.bind(signal))
    return signal
}
Signal.PENDING = 0
Signal.SUCCEEDED = 1
Signal.FAILED = 2
Signal.prototype = tie(Object.create(null), {
    callHandler: function(handler, value){
        try{
            const result = handler(value)
            if(result instanceof Signal)
                result.listen(this.onSuccess.bind(this), this.onError.bind(this))
            else
                this.onSuccess(result)
        }catch(error){
            this.onError(error)
        }
    },
    listen: function(onSuccess, onError, defer = true){
        if(this.status === Signal.SUCCEEDED)
            onSuccess(this.value)
        else if(this.status === Signal.FAILED)
            onError(this.value)
        else
            this.nextNode = {
                next: this.nextNode, defer,
                onSuccess, onError
            }
    },
    onSuccess: function(value){
        if(this.status !== Signal.PENDING)
            return false
        this.status = Signal.SUCCEEDED
        this.value = value
        while(this.nextNode)
            this.nextNode = (this.nextNode.defer ? defer(this.nextNode.onSuccess.bind(null, value))
                             : this.nextNode.onSuccess(value), this.nextNode.next)
    },
    onError: function(error){
        if(this.status !== Signal.PENDING)
            return false
        this.status = Signal.FAILED
        this.value = error
        while(this.nextNode)
            this.nextNode = (this.nextNode.defer ? defer(this.nextNode.onError.bind(null, error))
                             : this.nextNode.onError(error), this.nextNode.next)
    },
    pipe: function(transform, defer){
        const next = Signal()
        this.listen(next.callHandler.bind(next, transform), next.onError.bind(next), defer)
        return next
    },
    fix: function(transform, defer){
        const next = Signal()
        this.listen(next.onSuccess.bind(next), next.callHandler.bind(next, transform), defer)
        return next
    },
    filter: function(validate){
        const next = Signal()
        this.listen(next.onSuccess.bind(next).if(validate), next.onError.bind(next))
        return next
    },
    split: function(...signals){
        return Signal.all(signals.reverse().map(transform => {
            const intermediate = Signal()
            this.listen(intermediate.callHandler.bind(intermediate, transform), intermediate.onError.bind(intermediate))
            return intermediate
        }))
    }
})
Signal.just = value => Signal((succeed, fail) => succeed(value))
Signal.error = error => Signal((succeed, fail) => fail(error))
Signal.delay = time => Signal(succeed => window.setTimeout(succeed, time))

Signal.all = signals => Signal((succeed, fail) => {
    const values = []
    signals.forEach((signal, idx) => signal.listen(value => (values[idx] = value, signals.every(s => s.status !== Signal.PENDING) && succeed(values)), error => fail(error)))
})

const onReady = _ => Signal(resolve => window.document.readyState === 'complete' ? resolve() : window.addEventListener('load', resolve))

export {Signal, onReady}