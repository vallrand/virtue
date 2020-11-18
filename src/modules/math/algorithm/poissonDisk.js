const PoissonDisk = ({width, height, radius, rng = Math.random} = {}) => {
    const rejectThreshold = 30,
          radiusSquared = radius * radius,
          cellSize = radius / Math.sqrt(2),
          gridWidth = Math.ceil(width / cellSize),
          gridHeight = Math.ceil(height / cellSize),
          grid = new Array(gridWidth * gridHeight),
          queue = []
    let sampleSize = 0,
        queueSize = 0
    const far = (x, y) => {
        const cellX = x / cellSize | 0,
              cellY = y / cellSize | 0,
              minX = Math.max(cellX - 2, 0),
              minY = Math.max(cellY - 2, 0),
              maxX = Math.min(cellX + 3, gridWidth),
              maxY = Math.min(cellY + 3, gridHeight)
        for(let i, col = minY; col < maxY; i = ++col * gridWidth)
            for(let cell, row = minX; row < maxX; cell = grid[i + (++row)])
                if(cell && Math.pow(cell[0] - x) + Math.pow(cell[1] - y) < radiusSquared)
                    return false
        return true
    }
    const sample = (x, y) => {
        const s = [x, y]
        queue.push(s)
        grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s
        sampleSize++
        queueSize++
        return s
    }
    const generate = _ => {
        while(queueSize){
            const qi = rng() * queueSize | 0,
                  s = queue[qi]
            for(let i = 0; i < rejectThreshold; ++i){
                const rngAngle = rng() * 2 * Math.PI,
                      rngRadius = Math.sqrt(rng() * 3 * radiusSquared + radiusSquared),
                      x = s[0] + rngRadius * Math.cos(rngAngle),
                      y = s[1] + rngRadius * Math.sin(rngAngle)
                if(x >= 0 && x < width && y >= 0 && y < height && far(x, y))
                    return sample(x, y)
            }
            queue[qi] = queue[--queueSize]
            queue.length = queueSize
        }
    }
    return (limit, startingPoint) => {
        queue.length = sampleSize = queueSize = 0
        let samples = [startingPoint ? sample(startingPoint[0] + width/2, startingPoint[0] + height/2) : sample(rng() * width, rng() * height)],
            s = null
        while((s = generate()) && --limit) samples.push(s)

        const stride = 2,
              sampleArray = new Float32Array(samples.length * stride)
        samples.forEach((s, i) => {
            sampleArray[i*stride+0] = s[0] - width/2
            sampleArray[i*stride+1] = s[1] - height/2
        })
        return sampleArray
    }
}

export {PoissonDisk}