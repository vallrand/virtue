import {Pool} from '../../util'

const breadthFirstSearch = (queue => (root, visitFunction) => {
    if(!visitFunction(root)) return false
    queue.push(root)
    while(queue.length){
        let node = queue.pop()
        for(let i = node.children.length - 1; i >= 0; i--)
            if(visitFunction(node.children[i]))
                queue.push(node.children[i])
    }
    return true
})([])

const SolverNode = _ => ({ body: null, children: [], equations: [], visited: false })

const IslandSplitSolver = (subsolver, options) => {
    options = Object.assign({
        iterations: 10,
        tolerance: 1e-7,
        nodePoolLength: 128/4
    }, options || {})
    
    const nodePool = Pool(_ => SolverNode()),
          nodes = [],
          islandBodies = [],
          islandEquations = [],
          bodyIdMap = [],
          visitFunction = node => {
              if(node.visited || !node.body.dynamic) return false
              node.visited = true
              islandBodies.push(node.body)
              for(let i = node.equations.length - 1; i >= 0; i--){
                  let equation = node.equations[i]
                  if(islandEquations.indexOf(equation) !== -1) continue
                  islandEquations.push(equation)
              }
              return true
          }
    
    nodePool.allocate(options.nodePoolLength)
    
    return {
        get tolerance(){ return options.tolerance },
        get iterations(){ return options.iterations },
        set tolerance(value){ options.tolerance = value },
        set iterations(value){ options.iterations = value },
        solve: (equations, bodies, deltaTime) => {
            const bodyCount = bodies.length,
                  equationCount = equations.length
            //bodyIdMap.length = bodyCount //TODO allow to resize?
            for(let i = 0; i < bodyCount; i++){
                let node = nodes[i] || (nodes[i] = nodePool.obtain())
                node.body = bodies[i]
                bodyIdMap[node.body.index] = i
                node.children.length = 0
                node.equations.length = 0
                node.visited = false
            }
            for(let i = 0; i < equationCount; i++){
                let equation = equations[i],
                    idxA = bodyIdMap[equation.bodyA.index],
                    idxB =  bodyIdMap[equation.bodyB.index],
                    nodeA = nodes[idxA],
                    nodeB = nodes[idxB]
                nodeA.children.push(nodeB)
                nodeB.children.push(nodeA)
                nodeA.equations.push(equation)
                nodeB.equations.push(equation)
            }
            subsolver.tolerance = options.tolerance
            subsolver.iterations = options.iterations
            
            let iteration = 0
            for(let i = 0; i < bodyCount; i++){
                let child = nodes[i]
                
                if(!breadthFirstSearch(child, visitFunction, SolverNode.visitNode)) continue

                //TODO why do we need to sort?
                subsolver.solve(islandEquations.sort((a, b) => b.id - a.id), islandBodies, deltaTime)
                islandEquations.length = 0
                islandBodies.length = 0
                
                iteration++
            }
            return iteration
        }
    }
}

export {IslandSplitSolver}