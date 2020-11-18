const BinaryHeap = comparator => Object.assign(Object.create(BinaryHeap.prototype), { content: [], comparator })

BinaryHeap.prototype = {
    push: function(element){
        this.content.push(element)
        this.sinkDown(this.content.length - 1)
    },
    pop: function(){
        const element = this.content[0],
              last = this.content.pop()
        if(this.content.length > 0){
            this.content[0] = last
            this.bubbleUp(0)
        }
        return element
    },
    remove: function(element){
        const index = this.content.indexOf(element),
              last = this.content.pop()
        if(index === this.content.length - 1) return false
        this.content[index] = last
        this.comparator(last, element) < 0 ? this.sinkDown(index) : this.bubbleUp(index)
    },
    get size(){ return this.content.length },
    updateElement: function(element){ this.sinkDown(this.content.indexOf(element)) },
    sinkDown: function(index){
        let element = this.content[index]
        while(index > 0){
            let parentIndex = ((index + 1) >> 1) - 1,
                parent = this.content[parentIndex]
            if(this.comparator(element, parent) >= 0) break
            this.content[parentIndex] = element
            this.content[index] = parent
            index = parentIndex
        }
    },
    bubbleUp: function(index){
        const length = this.content.length,
              element = this.content[index]
        while(1){
            let rightChildIndex = (index + 1) << 1,
                leftChildIndex = rightChildIndex - 1,
                compareNode, swapIndex = null
            
            if(leftChildIndex < length && this.comparator(compareNode = this.content[leftChildIndex], element) < 0)
                swapIndex = leftChildIndex
            else compareNode = element

            if(rightChildIndex < length && this.comparator(this.content[rightChildIndex], compareNode) < 0)
                swapIndex = rightChildIndex
            
            
            if(swapIndex === null) break
            this.content[index] = this.content[swapIndex]
            this.content[swapIndex] = element
            index = swapIndex
        }
    }
}

export {BinaryHeap}