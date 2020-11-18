import {SQRT2} from '../constants'
import {BinaryHeap} from '../structs'

const astar = { //TODO move graph and this into pathfinding/navigation folder
    traversePath: node => {
        const path = [node]
        while(node = node.parent)
            path.unshift(node)
        return path
    },
    smoothPath: (graph, path) => {
        const checkPath = astar.sampleLine.bind(null, graph)
        for(let i = path.length - 1, node = path[i--]; i > 0; i--)
            checkPath(node, path[i-1]) ? path.splice(i, 1) : node = path[i]
        return path
    },
    sampleLine: (graph, start, end) => { //TODO works only for 2d grid
        const grid = graph.grid,
              minX = Math.min(start.x, end.x),
              minY = Math.min(start.y, end.y),
              maxX = Math.max(start.x, end.x),
              maxY = Math.max(start.y, end.y),
              dx = maxX - minX, dy = maxY - minY
        for(let x = minX, y = minY, stepX = 0, stepY = 0; stepX < dx || stepY < dy;){
            let distX = (0.5 + stepX) / dx,
                distY = (0.5 + stepY) / dy
            if(distX < distY)
                stepX++
            else if(distX > distY)
                stepY++
            else{
                stepX++
                stepY++
                if(!graph.estimateWeight(graph.grid[minX + stepX - 1][minY + stepY])) return false
                if(!graph.estimateWeight(graph.grid[minX + stepX][minY + stepY - 1])) return false
            }
            if(!graph.estimateWeight(graph.grid[minX + stepX][minY + stepY])) return false
        }
        return true
    },
    search: (graph, start, end, options = {}) => { //TODO async defer, split into multiple frames
        graph.cleanDirty(astar.cleanNode)
        const heuristic = options.heuristic || graph.heuristic
        const findClosest = options.findClosest || false
        const openHeap = BinaryHeap((a, b) => a.total - b.total || a.estimated - b.estimated)
        
        let closestNode = start
        
        start.estimated = heuristic(start, end)
        graph.markDirty(start)
        openHeap.push(start)
        
        while(openHeap.size > 0){
            const node = openHeap.pop()
            if(node === end) return astar.traversePath(node)
            
            node.closed = true
            const neighbors = graph.neighbors(node)
            for(let i = 0, length = neighbors.length; i < length; i++){
                const neighbor = neighbors[i],
                      traverseWeight = graph.estimateWeight(neighbor, node)
                if(neighbor.closed || !traverseWeight) continue
                const shortestDistance = node.distance + traverseWeight
                if(neighbor.visited && shortestDistance >= neighbor.distance) continue
                
                neighbor.parent = node
                neighbor.estimated = neighbor.estimated || heuristic(neighbor, end)
                neighbor.distance = shortestDistance
                neighbor.total = neighbor.estimated + neighbor.distance
                graph.markDirty(neighbor)
                
                
                if(findClosest && (closestNode.estimated - neighbor.estimated || closestNode.distance - neighbor.distance) > 0) closestNode = neighbor
                
                neighbor.visited ? openHeap.updateElement(neighbor) : openHeap.push(neighbor)
                neighbor.visited = true
            }
        }
        return findClosest ? astar.traversePath(closestNode) : []
    },
    cleanNode: function(node) {
        node.distance = node.estimated = node.total = 0
        node.visited = node.closed = false
        node.parent = null
    }
}

export {astar}