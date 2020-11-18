if(!Object.keys)
    Object.keys = function(obj){
        const keys = []
        for(let key in obj) keys.push(key)
        return keys
    }

if(!Object.values) Object.values = function(target){ return Object.keys(target).map(key => target[key]) }
    
Object.deepEquals = function(a, b){
    if(!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b
    const k1 = Object.keys(a),
          k2 = Object.keys(b)
    if(k1.length !== k2.length) return false
    
    for(let i = 0; i < k1.length; i++)
        if(!Object.deepEquals(a[k1[i]], b[k2[i]]))
            return false
    return true
}