Function.prototype.once = function(){
	let original = this
	return function(...args){
		if(original === null)
			return false
		original.call(this, ...args)
        original = null
	}
}

Function.prototype.if = function(assert){
    const original = this
    return function(...args){
        if(assert.call(this, ...args))
            original.call(this, ...args)
    }
}

Function.prototype.extend = function(base){ //TODO function overwrites
    const original = this
    return base ? function(...args){
        original.call(this, ...args)
        return base.call(this, ...args)
    } : this
}