import {SQRT2} from '../constants'

const heuristics = {
      manhattan: scale => (a, b) => scale * Math.abs(b.x - a.x) + Math.abs(b.y - a.y),
      diagonal: (scale, scale2) => (a, b) => {
          const dx = Math.abs(b.x - a.x),
                dy = Math.abs(b.y - a.y)
          return scale * (dx + dy) + (scale2 - 2 * scale) * Math.min(dx, dy)
      },
      euclidean: scale => (a, b) => {
          const dx = Math.abs(b.x - a.x),
                dy = Math.abs(b.y - a.y)
          return scale * Math.sqrt(dx * dx + dy * dy)
      }
}

const Graph = _ => Object.create(Graph.prototype)

Graph.prototype = {
    init: function(inputGrid, options){
        let minWeight = options.minWeight || 1
        this.diagonal = !!options.diagonal
        this.heuristic = (this.diagonal ? heuristics.diagonal : heuristics.manhattan)(minWeight, SQRT2)
        
        this.nodes = []
        this.grid = []
        for(let r = 0, width = inputGrid.length; r < width; r++)
            for(let c = 0, gridRow = this.grid[r] = [], inputGridRow = inputGrid[r], height = inputGridRow.length; c < height; c++)
                this.nodes.push(gridRow[c] = GridNode(r, c, inputGridRow[c]))
        this.dirtyNodes = this.nodes.slice()
        return this
    },
    neighbors: function(node){
        const neighbors = [],
              x = node.x,
              y = node.y,
              grid = this.grid
        if(grid[x - 1] && grid[x - 1][y]) neighbors.push(grid[x - 1][y])
        if(grid[x + 1] && grid[x + 1][y]) neighbors.push(grid[x + 1][y])
        if(grid[x] && grid[x][y - 1]) neighbors.push(grid[x][y - 1])
        if(grid[x] && grid[x][y + 1]) neighbors.push(grid[x][y + 1])
        if(this.diagonal){
            if(grid[x - 1] && grid[x - 1][y - 1] && grid[x - 1][y].traversable && grid[x][y - 1].traversable) neighbors.push(grid[x - 1][y - 1])
            if(grid[x + 1] && grid[x + 1][y - 1] && grid[x + 1][y].traversable && grid[x][y - 1].traversable) neighbors.push(grid[x + 1][y - 1])
            if(grid[x - 1] && grid[x - 1][y + 1] && grid[x - 1][y].traversable && grid[x][y + 1].traversable) neighbors.push(grid[x - 1][y + 1])
            if(grid[x + 1] && grid[x + 1][y + 1] && grid[x + 1][y].traversable && grid[x][y + 1].traversable) neighbors.push(grid[x + 1][y + 1])
        }
        return neighbors
    },
    cleanDirty: function(cleanNode){
        let idx = this.dirtyNodes.length
        while(idx--) cleanNode(this.dirtyNodes[idx])
        this.dirtyNodes.length = 0
    },
    markDirty: function(node){ this.dirtyNodes.push(node) },
    estimateWeight: (node, neighbour) => {
        if(!node.weight) return 0
        if(neighbour && neighbour.x != node.x && neighbour.y != node.y)
            return node.weight * SQRT2
        return node.weight
    }
}

const GridNode = (x, y, weight) => ({ x, y, weight })

export {Graph, heuristics}