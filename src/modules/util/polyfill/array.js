Array.prototype.remove = function(...elements){
    let idx = elements.length
    while(idx--){
        let index = this.indexOf(elements[idx])
        if(index !== -1)
            this.splice(index, 1)
    }
    return this
}

Array.range = function(from, to){
    if(to === undefined){
        to = from
        from = 0
    } 
    const result = []
    for(let i = from, c = 0; i < to; i++, c++)
        result[c] = i
    return result
}

Array.prototype.shuffle = function(){
    for(let j, i = this.length; i; (j = (Math.random() * i--) | 0), [this[i], this[j]] = [this[j], this[i]]);
    return this
}

Array.prototype.flatten = function(out = []){
    for(let length = this.length, i = 0; i < length; i++)
        for(let inner = this[i], innerLength = inner.length, j = 0; j < innerLength; j++)
            out.push(inner[j])
    return out
}

Array.prototype.unique = function(uniqueBy, result = []){
    const lookupMap = Object.create(null)
    for(let length = this.length, i = 0; i < length; i++){
        let value = this[i],
            fieldValue = uniqueBy(value)
        if(lookupMap[fieldValue]) continue
        lookupMap[fieldValue] = true
        result.push(value)
    }
    return result
}