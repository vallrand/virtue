import {PairsArray} from './broadphase'
import {Pool} from '../../util'
import {AABB} from '../math/aabb'

const DBVTNode = _ => ({
    pointer: null,
    aabb: AABB(),
    parent: null,
    left: null,
    right: null,
    height: 0
})

const DBVTree = _ => {
    const tree = Object.create(null),
          tempAABB = AABB(),
          nodePool = Pool(_ => DBVTNode())
    tree.root = null
    
    return Object.assign(tree, {
        nodePool,
        insertLeaf: leaf => {
            if(tree.root === null) return tree.root = leaf, leaf.parent = null, tree
            let sibling = tree.root
            while(!sibling.pointer){
                let left = sibling.left,
                    right = sibling.right,
                    creationCost = 2 * AABB.surfaceArea(AABB.extend(sibling.aabb, leaf.aabb, tempAABB)),
                    descendingCost = creationCost - 2 * AABB.surfaceArea(sibling.aabb),
                    descLeftCost = descendingCost + AABB.surfaceArea(AABB.extend(leaf.aabb, left.aabb, tempAABB)) - 
                    (left.pointer ? 0 : AABB.surfaceArea(left.aabb)),
                    descRightCost = descendingCost + AABB.surfaceArea(AABB.extend(leaf.aabb, right.aabb, tempAABB)) -
                    (right.pointer ? 0 : AABB.surfaceArea(right.aabb))
                if(creationCost < descLeftCost && creationCost < descRightCost)
                    break
                sibling = descLeftCost < descRightCost ? left : right
            }

            let prevParent = sibling.parent,
                parent = nodePool.obtain()
            parent.parent = prevParent
            parent.left = leaf
            parent.right = sibling
            AABB.extend(leaf.aabb, sibling.aabb, parent.aabb)
            parent.height = sibling.height + 1
            sibling.parent = leaf.parent = parent

            if(sibling === tree.root) tree.root = parent
            else if(prevParent.left === sibling) prevParent.left = parent
            else prevParent.right = parent

            tree.update(parent)
            return tree
        },
        removeLeaf: leaf => {
            if(tree.root === leaf) return tree.root = null, tree
            let parent = leaf.parent,
                sibling = parent.left === leaf ? parent.right : parent.left
            if(tree.root === parent) return tree.root = sibling, sibling.parent = null, tree
            let grandParent = parent.parent
            sibling.parent = grandParent
            grandParent.left === parent ? grandParent.left = sibling : grandParent.right = sibling
            nodePool.release(parent)
            tree.update(grandParent)
            return tree
        },
        update: node => { while(node = tree.updateNodeProperties(tree.balance(node)).parent); },
        updateNodeProperties: node => {
            let L = node.left,
                R = node.right
            AABB.extend(L.aabb, R.aabb, node.aabb)
            node.height = Math.max(L.height, R.height) + 1
            return node
        },
        balance: node => {
            const height = node.height
            if(height < 2) return node

            const parent = node.parent,
                  L = node.left,
                  R = node.right,
                  balance = L.height - R.height
            
            if(balance > 1){
                let LL = L.left,
                    LR = L.right
                if(LL.height > LR.height){
                    L.right = node
                    node.parent = L
                    node.left = LR
                    LR.parent = node
                }else{
                    L.left = node
                    node.parent = L
                    node.left = LL
                    LL.parent = node
                }
                tree.updateNodeProperties(node)
                tree.updateNodeProperties(L) //TODO can be removed
                if(!parent) tree.root = L
                else if(parent.left === node) parent.left = L
                else parent.right = L
                L.parent = parent
                return L
            }else if(balance < -1){
                let RL = R.left,
                    RR = R.right
                if(RL.height > RR.height){
                    R.right = node
                    node.parent = R
                    node.right = RR
                    RR.parent = node
                }else{
                    R.left = node
                    node.parent = R
                    node.right = RL
                    RL.parent = node
                }
                tree.updateNodeProperties(node)
                tree.updateNodeProperties(R) //TODO can be removed
                if(!parent) tree.root = R
                else if(parent.left === node) parent.left = R
                else parent.right = R
                R.parent = parent
                return R
            }
            return node
        }
    })
}

const DynamicBoundingVolumeTreeBroadphase = ({checkCollisionFlags, testCollision}) => {
    const tree = DBVTree(),
          leaves = [],
          stack = [],
          margin = 0.1
    
    return {
        add: body => {
            const node = tree.nodePool.obtain()
            node.height = 0
            node.left = node.right = null
            node.pointer = body
            leaves.push(node)
            tree.insertLeaf(node)
        },
        remove: body => {
            let idx = leaves.findIndex(leaf => leaf.pointer === body)
            if(idx == -1) return false
            let leaf = leaves[idx]
            leaf.pointer = null
            tree.removeLeaf(leaf)
            tree.nodePool.release(leaf)
            leaves.splice(idx, 1)
        },
        queryCandidates: (pairs = PairsArray()) => {
            for(let i = leaves.length - 1; i >= 0; i--){
                const leaf = leaves[i]
                //if(!leaf.pointer.dynamic) continue
                if(AABB.contains(leaf.aabb, leaf.pointer.aabb)) continue
                AABB.copy(leaf.pointer.aabb, leaf.aabb)
                AABB.margin(leaf.aabb, margin, leaf.aabb)
                tree.removeLeaf(leaf).insertLeaf(leaf)
            }
            for(let i = leaves.length - 1; i >= 0; i--){
                const nodeA = leaves[i],
                      bodyA = nodeA.pointer
                
                let parent, node = nodeA
                while(parent = node.parent){
                    if(node === parent.left) //TODO move AABB overlap check to be before adding into stack
                        stack.push(parent.right)
                    node = parent
                }

                while(stack.length){
                    let nodeB = stack.pop(),
                        bodyB = nodeB.pointer
                    if(bodyB){
                        if(!checkCollisionFlags(bodyA, bodyB)) continue
                        if(testCollision(bodyA, bodyB)) pairs.add(bodyA, bodyB)
                    }else if(!AABB.overlap(bodyA.aabb, nodeB.aabb)) continue //TODO check before adding into stack
                    else nodeB.left.height > nodeB.right.height ? stack.push(nodeB.left, nodeB.right) : stack.push(nodeB.right, nodeB.left)
                }
            }            
        }
    }
}

export {DynamicBoundingVolumeTreeBroadphase}