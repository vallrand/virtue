import {tie} from './factory'

const Queue = function(){
    const queue = Object.create(Queue.prototype)
    queue.front = []
    queue.tail = []
    queue.frontIdx = 0
    queue.tailIdx = 0
    return queue
}

Queue.prototype = tie(Object.create(null), {
    push: function(item){
        this.front[this.frontIdx++] = item
        return this
    },
    shift: function(){
        if(this.tailIdx >= this.tail.length){
            this.front.length = this.frontIdx
            let front = this.tail
            this.tail = this.front
            this.front = front
            this.frontIdx = 0
            this.tailIdx = 0
        }
        if(this.tail.length <= 0)
            return null
        const item = this.tail[this.tailIdx]
        this.tail[this.tailIdx++] = undefined
        return item
    },
    get length(){
        return this.frontIdx + this.tail.length - this.tailIdx
    },
    hasElement: function(el){
        return this.front.indexOf(el) != -1 || this.tail.indexOf(el) != -1
    }
})

export {Queue}