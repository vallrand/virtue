import {tie} from './factory'
import {defer} from './worker'
import {Signal} from './signal'

const Stream = emitter => {
    const stream = Object.create(Stream.prototype)
    if(emitter)
        defer(emitter.bind(stream, stream.onSuccess.bind(stream)))
    return stream
}
Stream.prototype = tie(Object.create(null), {
    onSuccess: function(value){
        let node = this.nextNode
        while(node) node = (node.defer ? defer(node.onSuccess.bind(null, value)) : node.onSuccess(value), node.nextNode)
    },
    onError: function(error){
        let node = this.nextNode
        while(node) node = (node.defer ? defer(node.onError.bind(null, error)) : node.onError(error), node.nextNode)
    },
    attach: function(onSuccess, onError, defer = true){
        const node = this.nextNode = {
            prevNode: this,
            nextNode: this.nextNode,
            onSuccess, onError, defer
        }
        if(node.nextNode) node.nextNode.prevNode = node
        return node
    },
    detach: function(node){
        if(!node) return false
        if(node.prevNode) node.prevNode.nextNode = node.nextNode
        if(node.nextNode) node.nextNode.prevNode = node.prevNode
    },
    callHandler: function(handler, value){
        try{
            const result = handler.call(this, value)
            if(result instanceof Stream)
                result.attach(this.onSuccess.bind(this), this.onError.bind(this))
            else if(result instanceof Signal)
                result.listen(this.onSuccess.bind(this), this.onError.bind(this))
            else
                this.onSuccess(result)
        }catch(error){
            this.onError(error)
        }
    },
    pipe: function(transform, defer){
        const next = Stream()
        this.attach(next.callHandler.bind(next, transform), next.onError.bind(next), defer)
        return next
    },
    fix: function(transform, defer){
        const next = Stream()
        this.attach(next.onSuccess.bind(next), next.callHandler.bind(next, transform), defer)
        return next
    },
    default: function(value){
        this.attach = function(onSuccess, onError){
            defer(onSuccess.bind(null, value))
            Stream.prototype.attach.call(this, onSuccess, onError)
        }
        return this
    },
    once: function(){
        const next = Stream(),
              node = this.attach(value => (this.detach(node), next.onSuccess(value)),
                              error => (this.detach(node), next.onError(error)))
        return next
    },
    until: function(initCallback){
        const next = Stream(),
              node = this.attach(next.onSuccess.bind(next), next.onError.bind(next))
        initCallback(this.detach.bind(this, node).once())
        return next
    },
    filter: function(validate){
        const next = Stream()
        this.attach(next.onSuccess.bind(next).if(validate), next.onError.bind(next))
        return next
    },
    clear: function(){
        while(this.nextNode)
            this.detach(this.nextNode)
    },
    buffer: function(bufferSize, executor){
        let valueCount = 0
        const next = Stream(),
              buffer = [],
              emitValue = value => (valueCount++, Signal(executor.bind(null, value)).listen(spreadValue, spreadError)),
              spreadValue = value => (valueCount--, buffer.length == 0 || emitValue(buffer.shift()), next.onSuccess.call(next, value)),
              spreadError = error => (valueCount--, buffer.length == 0 || emitValue(buffer.shift()), next.onError.call(next, error))
              
        this.attach(value => valueCount < bufferSize ? emitValue(value) : buffer.push(value), next.onError.bind(next))
        return next
    }
})
Stream.minInterval = minTime => {
    let timeoutId = null
    return _ => Signal(resolve => (window.clearTimeout(timeoutId), timeoutId = window.setTimeout(resolve, minTime)))
}
Stream.from = array => Stream(consume => array.forEach(value => consume(value)))

export {Stream}