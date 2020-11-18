const composeKey16 = (i, j) => {
    i |= 0
    j |= 0
    return i > j ?
        (i << 16) | (j & 0xFFFF) :
        (j << 16) | (i & 0xFFFF)
}

const composeTriangularKey = (i, j) => {
    i |= 0
    j |= 0
    return i > j ?
        (i * (i + 1) >> 1) + j-1 :
        (j * (j + 1) >> 1) + i-1
}

const OverlapMatrix = (composeKey = composeTriangularKey, frameThreshold = 1) => {
    const matrix = [],
          overlaps = [],
          additions = [],
          removals = []
    
    return {
        allocate: count => matrix.length = composeKey(count, count - 1),
        get: (i, j) => matrix[composeKey(i, j)],
        set: (i, j, frame) => {
            const key = composeKey(i, j),
                  prevFrame = matrix[key]
            matrix[key] = frame
            if(prevFrame === undefined || frame - prevFrame > frameThreshold){
                //additions.push(i, j) //TODO additions and removal query
                return true
            }else{
                return false
            }
        },
        clear: _ => {
            additions.length = 0
            removals.length = 0
            matrix.length = 0
        },
        get additions(){
            return additions
        }
    }
}

export {OverlapMatrix}