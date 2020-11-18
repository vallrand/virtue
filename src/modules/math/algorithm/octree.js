import {tie} from '../../util'
import {vec2, vec3, vec4, mat3, mat4} from '../structs'
import {generateUUID} from '../abstract'

const INDEX_INSIDE_CROSS = -1,
  INDEX_OUTSIDE_OFFSET = 2,
  INDEX_OUTSIDE_POS_X = 0,
  INDEX_OUTSIDE_NEG_X = 1,
  INDEX_OUTSIDE_POS_Y = 2,
  INDEX_OUTSIDE_NEG_Y = 3,
  INDEX_OUTSIDE_POS_Z = 4,
  INDEX_OUTSIDE_NEG_Z = 5,
  FLAG_POS_X = 1 << (INDEX_OUTSIDE_POS_X + 1),
  FLAG_NEG_X = 1 << (INDEX_OUTSIDE_NEG_X + 1),
  FLAG_POS_Y = 1 << (INDEX_OUTSIDE_POS_Y + 1),
  FLAG_NEG_Y = 1 << (INDEX_OUTSIDE_NEG_Y + 1),
  FLAG_POS_Z = 1 << (INDEX_OUTSIDE_POS_Z + 1),
  FLAG_NEG_Z = 1 << (INDEX_OUTSIDE_NEG_Z + 1),
  INDEX_OUTSIDE_MAP = []
INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_POS_X] = { index: INDEX_OUTSIDE_POS_X, count: 0, x: 1, y: 0, z: 0 }
INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_NEG_X] = { index: INDEX_OUTSIDE_NEG_X, count: 0, x: -1, y: 0, z: 0 }
INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_POS_Y] = { index: INDEX_OUTSIDE_POS_Y, count: 0, x: 0, y: 1, z: 0 }
INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_NEG_Y] = { index: INDEX_OUTSIDE_NEG_Y, count: 0, x: 0, y: -1, z: 0 }
INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_POS_Z] = { index: INDEX_OUTSIDE_POS_Z, count: 0, x: 0, y: 0, z: 1 }
INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_NEG_Z] = { index: INDEX_OUTSIDE_NEG_Z, count: 0, x: 0, y: 0, z: -1 }

const OctreeSegment = (pointer, segment) => tie(Object.create(OctreeSegment.prototype), {
    pointer, segment, snapshot: { position: vec3(), radius: 0, indexOctant: null }
})
OctreeSegment.prototype = {
    get radius(){ return this.segment.radius },
    get position(){ return this.segment.position },
    get dirty(){ 
        const position = this.position,
              prevPosition = this.snapshot.position,
              radius = this.radius,
              prevRadius = this.snapshot.radius
        return radius !== prevRadius || position[0] !== prevPosition[0] || position[1] !== prevPosition[1] || position[2] !== prevPosition[2]
    },
    set dirty(value){
        if(!value){
            this.snapshot.radius = this.radius
            vec3.copy(this.position, this.snapshot.position)
        }
    },
    get indexOctant(){ return this.snapshot.indexOctant },
    set indexOctant(value){
        this.snapshot.indexOctant = value
        this.dirty = false
    }
}

const Octree = options => {
    const tree = Object.create(Octree.prototype) 
    options = Object.assign({
        maxDepth: Infinity,
        objectsThreshold: 8,
        overlapPercent: 0.15,
        deferred: true,
        tree
    }, options || {})
    let root = null
    
    tie(tree, {
        nodeCount: 0,
        objects: [],
        objectMap: {},
        segmentList: [],
        deferredActions: [],
        maxDepth: options.maxDepth,
        objectsThreshold: options.objectsThreshold,
        overlapPercent: options.overlapPercent,
        deferred: options.deferred,
        tempVec3: vec3(),
        update: _ => {
            tree.deferredActions.forEach(deferred => deferred.context[deferred.action].apply(deferred.context, deferred.args))
            tree.deferredActions.length = 0
        },
        add: (pointer, mapper) => tree.deferred ? tree.deferredActions.push({ context: tree, action: 'addDeferred', args: [pointer, mapper] }) : tree.addDeferred(pointer, mapper),
        addDeferred: (pointer, mapper) => {
            if(pointer instanceof OctreeSegment) pointer = pointer.pointer
            if(!pointer.uuid) pointer.uuid = generateUUID()
            if(tree.objectMap[pointer.uuid]) return false

            tree.objects.push(pointer)
            tree.objectMap[pointer.uuid] = pointer

            mapper(pointer).map(segment => new OctreeSegment(pointer, segment))
            .forEach(segment => {
                tree.segmentList.push(segment)
                tree.root.addObject(segment)
            })
        },
        remove: pointer => {
            if(pointer instanceof OctreeSegment) pointer = pointer.pointer
            tree.deferredActions = tree.deferredActions.filter(deferred => !(deferred.action === 'addDeferred' && deferred.args[0] === pointer))
            if(!tree.objectMap[pointer.uuid]) return true
            tree.objectMap[pointer.uuid] = undefined
            tree.objects.splice(tree.objects.indexOf(pointer), 1)
            tree.root.removeObject(pointer)
            .forEach(removedSegment => {
                let index = tree.segmentList.indexOf(removedSegment)
                if(index !== -1) tree.segmentList.splice(index, 1)
            })
        },
        extend: octree => {
            const segmentMap = octree.objectData.reduce((segments, segment) => {
                segments[segment.pointer.uuid] = segments[segment.pointer.uuid] || []
                segments[segment.pointer.uuid].push(segment.segment)
                return segments
            }, Object.create(null))
            const mapper = pointer => segmentMap[pointer.uuid]
            octree.objects.forEach(pointer => tree.add(pointer, mapper))
        },
        rebuild: _ => {
            tree.segmentList.filter(segment => segment.node instanceof OctreeNode && segment.dirty && segment.indexOctant != segment.node.getOctantIndex(segment))
            .map(segment => {
                const node = segment.node
                node.removeObject(segment)
                return { node, segment }
            }).forEach(({ node, segment }) => node.attached ? node.addObject(segment) : tree.root.addObject(segment))
        },
        search: (position, radius, direction, options = {}) => {
            radius = radius > 0 ? radius : Number.MAX_VALUE
            let invDirection = direction ? vec3.divide(vec3(1,1,1), vec3.normalize(direction), tree.tempVec3) : null
            let objects = tree.root.objects.slice()
            for(let i = 0, l = tree.root.nodeIndices.length; i < l; i++)
                objects = tree.root.nodesByIndex[tree.root.nodeIndices[i]].search(position, radius, invDirection, objects)
            if(!options.groupByObject) return objects

            let results = []
            let resultsObjectsIndices = []
            //TODO improve grouping
            for(let i = 0, l = objects.length; i < l; i++){
                let objectData = objects[i]
                let object = objectData.pointer
                let resultObjectIndex = resultsObjectsIndices.indexOf(object)
                if(resultObjectIndex === -1){
                    results.push({
                        object: object
                    })
                    resultsObjectsIndices.push(object)
                }
            }
            return results
        },
        get root(){ return root },
        set root(value){
            if(!value instanceof OctreeNode) return false
            root = value
            value.updateProperties()
        },
        get depthEnd(){ return tree.root.depthEnd },
        get nodeCountEnd(){ return tree.root.nodeCountEnd },
        get objectCountEnd(){ return tree.root.objectCountEnd }
    })
    root = options.root || new OctreeNode(options)
    return tree
}

const OctreeNode = function ({tree, position = vec3(), radius, indexOctant, parent}) {
    const node = Object.create(OctreeNode.prototype)
    Object.assign(node, {
        tree, position, indexOctant, depth: 0,
        radius: Math.max(radius || 0, 1),
        id: tree.nodeCount++
    })
    node.reset(false)
    node.parent = parent

    node.overlap = node.radius * tree.overlapPercent
    node.radiusOverlap = node.radius + node.overlap
    node.left = node.position[0] - node.radiusOverlap
    node.right = node.position[0] + node.radiusOverlap
    node.bottom = node.position[1] - node.radiusOverlap
    node.top = node.position[1] + node.radiusOverlap
    node.back = node.position[2] - node.radiusOverlap
    node.front = node.position[2] + node.radiusOverlap
    return node
}

OctreeNode.prototype = {
    set parent(parent){
        if(parent === this || this.parentNode === parent) return false
        this.parentNode = parent
        this.updateProperties()
    },
    get parent(){ return this.parentNode },
    get attached(){ return this.parent || this.tree.root === this },
    updateProperties: function () {
        if(!this.parent)
            this.depth = 0
        else{
            this.tree = this.parent.tree
            this.depth = this.parent.depth + 1
        }
        for(let i = 0, l = this.nodeIndices.length; i < l; i++)
            this.nodesByIndex[this.nodeIndices[i]].updateProperties()
    },
    reset: function(cascade){
        (this.nodeIndices || []).forEach(i => {
            let node = this.nodesByIndex[i]
            node.parent = undefined
            if(cascade) node.reset(cascade)
        })
        this.objects = []
        this.nodeIndices = []
        this.nodesByIndex = Object.create(null)
    },
    addNode: function (node, indexOctant){
        node.indexOctant = indexOctant
        if(this.nodeIndices.indexOf(indexOctant) === -1) this.nodeIndices.push(indexOctant)
        this.nodesByIndex[indexOctant] = node
        if(node.parent !== this) node.parent = this
    },
    removeNode: function (indexOctant){
        this.nodeIndices.splice(this.nodeIndices.indexOf(indexOctant), 1)
        const node = this.nodesByIndex[indexOctant]
        delete this.nodesByIndex[indexOctant]
        if(node.parent === this) node.parent = undefined
    },
    deferAction: function(action){
        if(this.tree.deferred)
            if(!this.tree.deferredActions.some(deferred => deferred.action === action && deferred.context === this))
                this.tree.deferredActions.push({ context: this, action })
        else
            this[action].call(this)
    },
    addObject: function(object){
        const indexOctant = this.getOctantIndex(object)
        
        if(indexOctant > -1 && this.nodeIndices.length > 0)
            this.branch(indexOctant).addObject(object)
        else if(indexOctant < -1 && this.parent instanceof OctreeNode)
            this.parent.addObject(object)
        else{
            if(this.objects.indexOf(object) === -1) this.objects.push(object)
            object.node = this
            this.deferAction('checkGrow')
        }
    },
    transferObject: function(objects){
        let idx = objects.length
        while(idx--) this.objects.push((objects[idx].node = this, objects[idx]))
    },
    removeObject: function(object){
        const removeContext = { searchComplete: false, nodesRemovedFrom: [], removedSegments: [] }
        this.removeObjectRecursive(object, removeContext)
        let idx = removeContext.nodesRemovedFrom.length
        while(idx--) removeContext.nodesRemovedFrom[idx].deferAction('shrink')
        return removeContext.removedSegments
    },
    removeObjectRecursive: function(object, removeContext){
        let wasRemoved = false
        if(object instanceof OctreeSegment){
            let index = this.objects.indexOf(object)
            if(index !== -1){
                this.objects.splice(index, 1)
                object.node = undefined
                removeContext.removedSegments.push(object)
                wasRemoved = true
                removeContext.searchComplete = true
            }
        }else{
            for(let i = this.objects.length - 1; i >= 0; i--){
                let segment = this.objects[i]
                if(segment.pointer !== object) continue
                this.objects.splice(i, 1)
                segment.node = undefined
                removeContext.removedSegments.push(segment)
                wasRemoved = true
            }
        }
        if(wasRemoved) removeContext.nodesRemovedFrom.push(this)
        
        if(!removeContext.searchComplete)
            for(let i = 0, l = this.nodeIndices.length; i < l; i++)
                if((removeContext = this.nodesByIndex[this.nodeIndices[i]].removeObjectRecursive(object, removeContext)).searchComplete) break
        
        return removeContext
    },
    checkGrow: function(){
        if(this.tree.objectsThreshold && this.objects.length > this.tree.objectsThreshold)
            this.grow()
    },
    grow: function () {
        const objectsExpand = [],
              objectsExpandOctants = [],
              objectsSplit = [],
              objectsSplitOctants = []
        let objectsRemaining = []
        
        for(let i = 0, l = this.objects.length; i < l; i++){
            const object = this.objects[i],
                  indexOctant = this.getOctantIndex(object)
            if(indexOctant > -1){
                objectsSplit.push(object)
                objectsSplitOctants.push(indexOctant)
            }else if(indexOctant < -1){
                objectsExpand.push(object)
                objectsExpandOctants.push(indexOctant)
            }else
                objectsRemaining.push(object)
        }

        if(objectsSplit.length > 0) objectsRemaining = objectsRemaining.concat(this.split(objectsSplit, objectsSplitOctants))

        if(objectsExpand.length > 0) objectsRemaining = objectsRemaining.concat(this.expand(objectsExpand, objectsExpandOctants))

        this.objects = objectsRemaining
        this.checkMerge()
    },
    split: function(objects, octants){
        if(this.depth >= this.tree.maxDepth) return this.objects

        objects = objects || this.objects
        octants = octants || []
        const objectsRemaining = objects.filter((object, i) => octants[i] <= -1 || this.branch(octants[i]).addObject(object) & 0)

        if(objects === this.objects) this.objects = objectsRemaining

        if(objectsRemaining.length > 0)console.log(objectsRemaining)
        return objectsRemaining
    },
    branch: function (indexOctant){
        if(this.nodesByIndex[indexOctant] instanceof OctreeNode) return this.nodesByIndex[indexOctant]
        
        const radius = this.radiusOverlap * 0.5,
              overlap = radius * this.tree.overlapPercent,
              radiusOffset = radius - overlap,
              position = vec3.add(this.position, vec3(
                  indexOctant & 1 ? radiusOffset : -radiusOffset,
                  indexOctant & 2 ? radiusOffset : -radiusOffset,
                  indexOctant & 4 ? radiusOffset : -radiusOffset
              )),
              node = new OctreeNode({
                  tree: this.tree,
                  parent: this,
                  position,
                  radius,
                  indexOctant
              })
        this.addNode(node, indexOctant)
        return node
    },
    expand: function (objects = this.objects, octants = []) {
        if (this.tree.root.depthEnd >= this.tree.maxDepth) return objects
        
        const objectsRemaining = [],
              objectsExpand = []
        
        for (let i = 0, l = INDEX_OUTSIDE_MAP.length; i < l; INDEX_OUTSIDE_MAP[i++].count = 0);

        for (let i = 0, l = objects.length; i < l; i++){
            let object = objects[i]
            let indexOctant = octants[i]
            
            if(indexOctant < -1)
                objectsExpand.push(object)
            else{
                objectsRemaining.push(object)
                continue
            }

            const flagsOutside = -indexOctant - INDEX_OUTSIDE_OFFSET

            if(flagsOutside & FLAG_POS_X) INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_POS_X].count++
            else if(flagsOutside & FLAG_NEG_X) INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_NEG_X].count++
            
            if(flagsOutside & FLAG_POS_Y) INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_POS_Y].count++
            else if(flagsOutside & FLAG_NEG_Y) INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_NEG_Y].count++
            
            if(flagsOutside & FLAG_POS_Z) INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_POS_Z].count++
            else if(flagsOutside & FLAG_NEG_Z) INDEX_OUTSIDE_MAP[INDEX_OUTSIDE_NEG_Z].count++
        }

        if(this.parent && objectsExpand.length > 0)   
            objectsExpand.forEach(this.parent.addObject.bind(this.parent))
        else if(objectsExpand.length > 0){
            const indexesOutside = INDEX_OUTSIDE_MAP.slice().sort((a, b) => b.count - a.count),
                  indexOutside0 = indexesOutside[0],
                  indexBitwise0 = indexOutside0.index | 1,
                  infoPotential1 = indexesOutside[1],
                  infoPotential2 = indexesOutside[2],
                  indexOutside1 = (infoPotential1.index | 1) !== indexBitwise0 ? infoPotential1 : infoPotential2,
                  indexOutsideBitwise2 = indexOutside1.index | 1,
                  infoPotential3 = indexesOutside[3],
                  infoPotential4 = indexesOutside[4],
                  indexPotentialBitwise1 = infoPotential2.index | 1,
                  indexPotentialBitwise2 = infoPotential3.index | 1,
                  indexOutside2 = (indexPotentialBitwise1 !== indexBitwise0 && indexPotentialBitwise1 !== indexOutsideBitwise2) ? infoPotential2 : 
                                    (indexPotentialBitwise2 !== indexBitwise0 && indexPotentialBitwise2 !== indexOutsideBitwise2) ? infoPotential3 : infoPotential4,
                  
                  octantX = indexOutside0.x + indexOutside1.x + indexOutside2.x,
                  octantY = indexOutside0.y + indexOutside1.y + indexOutside2.y,
                  octantZ = indexOutside0.z + indexOutside1.z + indexOutside2.z,
                  indexOctant = this.getOctantIndexFromPosition(octantX, octantY, octantZ),
                  indexOctantInverse = this.getOctantIndexFromPosition(-octantX, -octantY, -octantZ),
                  radiusParent = this.tree.overlapPercent > 0 ? this.overlap / ((0.5 * this.tree.overlapPercent) * (1 + this.tree.overlapPercent)) : this.radius * 2,
                  overlapParent = radiusParent * this.tree.overlapPercent,
                  radiusOffset = (radiusParent + overlapParent) - (this.radius + this.overlap)
            
            const position = vec3.add(this.position, vec3(
                indexOctant & 1 ? radiusOffset : -radiusOffset,
                indexOctant & 2 ? radiusOffset : -radiusOffset,
                indexOctant & 4 ? radiusOffset : -radiusOffset
            )),
                  parent = new OctreeNode({
                      tree: this.tree,
                      position,
                      radius: radiusParent
                  })
            parent.addNode(this, indexOctantInverse)
            this.tree.root = parent
            objectsExpand.forEach(this.tree.root.addObject.bind(this.tree.root))
        }

        if(objects === this.objects) this.objects = objectsRemaining

        return objectsRemaining
    },
    shrink: function () {
        this.checkMerge()
        this.tree.root.checkContract()
    },
    checkMerge: function (){
        let nodeParent = this,
            nodeMerge = null

        while(nodeParent.parent && nodeParent.objectCountEnd < this.tree.objectsThreshold){
            nodeMerge = nodeParent
            nodeParent = nodeParent.parent
        }
        if(nodeParent !== this) nodeParent.merge(nodeMerge)
    },
    merge: function (nodes){
        nodes = nodes instanceof Array ? nodes : [nodes]   
        nodes.forEach(node => {
            this.transferObject(node.objectsEnd)
            node.reset(true)
            this.removeNode(node.indexOctant, node)
        })
        this.checkMerge()
    },
    checkContract: function () {
        if(this.nodeIndices.length == 0) return false

        let nodeHeaviest = undefined,
            nodeHeaviestObjectsCount = 0,
            outsideHeaviestObjectsCount = this.objects.length

        for(let i = 0, l = this.nodeIndices.length; i < l; i++){
            let node = this.nodesByIndex[this.nodeIndices[i]]
            let nodeObjectsCount = node.objectCountEnd
            outsideHeaviestObjectsCount += nodeObjectsCount
            if(nodeHeaviest instanceof OctreeNode && nodeObjectsCount <= nodeHeaviestObjectsCount) continue
            nodeHeaviest = node
            nodeHeaviestObjectsCount = nodeObjectsCount
        }
        outsideHeaviestObjectsCount -= nodeHeaviestObjectsCount

        if(nodeHeaviest instanceof OctreeNode && outsideHeaviestObjectsCount < this.tree.objectsThreshold)
            this.contract(nodeHeaviest)
    },
    contract: function (rootNode) {
        for(let i = 0, l = this.nodeIndices.length; i < l; i++){
            let node = this.nodesByIndex[this.nodeIndices[i]]
            if(node === rootNode) continue
            rootNode.transferObject(node.objectsEnd)
            node.reset(true)
        }

        rootNode.transferObject(this.objects)
        this.reset(false)
        this.tree.root = rootNode
        rootNode.checkContract()
    },
    getOctantIndex: function(segment){
        const objectRadius = segment.radius || 0,
              objectPosition = segment.position,
              overlap = this.overlap,
              radiusOverlap = this.radiusOverlap,
              position = this.position
        let indexOctant = 0
        
        const deltaX = objectPosition[0] - position[0],
              deltaY = objectPosition[1] - position[1],
              deltaZ = objectPosition[2] - position[2],
              distX = Math.abs(deltaX),
              distY = Math.abs(deltaY),
              distZ = Math.abs(deltaZ),
              distance = Math.max(distX, distY, distZ)

        if(distance + objectRadius > radiusOverlap){
            if(distX + objectRadius > radiusOverlap) indexOctant ^= deltaX > 0 ? FLAG_POS_X : FLAG_NEG_X
            if(distY + objectRadius > radiusOverlap) indexOctant ^= deltaY > 0 ? FLAG_POS_Y : FLAG_NEG_Y
            if(distZ + objectRadius > radiusOverlap) indexOctant ^= deltaZ > 0 ? FLAG_POS_Z : FLAG_NEG_Z
            return segment.indexOctant = -indexOctant - INDEX_OUTSIDE_OFFSET
        }
        if(deltaX - objectRadius > -overlap) indexOctant |= 1
        else if(deltaX + objectRadius >= overlap) return segment.indexOctant = INDEX_INSIDE_CROSS

        if(deltaY - objectRadius > -overlap) indexOctant |= 2
        else if(deltaY + objectRadius >= overlap) return segment.indexOctant = INDEX_INSIDE_CROSS

        if(deltaZ - objectRadius > -overlap) indexOctant |= 4
        else if(deltaZ + objectRadius >= overlap) return segment.indexOctant = INDEX_INSIDE_CROSS

        return segment.indexOctant = indexOctant
    },
    getOctantIndexFromPosition: (x, y, z) => (x > 0) | (y > 0) << 1 | (z > 0) << 2,
    search: function(position, radius, invDirection, objects){
        if(invDirection ? this.intersectRay(position, invDirection, radius) : this.intersectSphere(position, radius)){
            objects = objects.concat(this.objects)
            for(let i = 0, l = this.nodeIndices.length; i < l; i++)
                objects = this.nodesByIndex[this.nodeIndices[i]].search(position, radius, invDirection, objects)
        }
        return objects
    },
    intersectSphere: function(center, radius){
        const x = center[0], y = center[1], z = center[2]
        let distance = radius * radius,
            diff = 0
        if(     (diff = x - this.left) < 0) distance -= diff*diff
        else if((diff = x - this.right) > 0) distance -= diff*diff
        if(     (diff = y - this.bottom) < 0) distance -= diff*diff
        else if((diff = y - this.top) > 0) distance -= diff*diff
        if(     (diff = z - this.back) < 0) distance -= diff*diff
        else if((diff = z - this.front) > 0) distance -= diff*diff
        return distance >= 0
    },
    intersectRay: function (origin, invDirection, maxDistance){
        const t0 = invDirection[0] * (this.left - origin[0]),
              t1 = invDirection[0] * (this.right - origin[0]),
              t2 = invDirection[1] * (this.bottom - origin[1]),
              t3 = invDirection[1] * (this.top - origin[1]),
              t4 = invDirection[2] * (this.back - origin[2]),
              t5 = invDirection[2] * (this.front - origin[2]),
              tmax = Math.min(Math.max(t0, t1), Math.max(t2, t3), Math.max(t4, t5))
        if(tmax < 0) return false
        const tmin = Math.max(Math.min(t0, t1), Math.min(t2, t3), Math.min(t4, t5))
        return tmin < tmax && tmin < maxDistance
    },
    get depthEnd(){ return this.nodeIndices.reduce((depth, i) => Math.max(depth, this.nodesByIndex[i].depthEnd), this.depth) },
    get nodeCountEnd(){ return this.tree.root.nodeCountRecursive + 1 },
    get nodeCountRecursive(){ return this.nodeIndices.reduce((count, i) => count + this.nodesByIndex[i].nodeCountRecursive, this.nodeIndices.length) },
    get objectsEnd(){ return this.nodeIndices.reduce((objects, i) => objects.concat(this.nodesByIndex[i].objectsEnd), this.objects.slice()) },
    get objectCountEnd(){
        return this.nodeIndices.reduce((count, i) => count + this.nodesByIndex[i].objectCountEnd, this.objects.length)
        //let count = this.objects.length,
        //    idx = this.nodeIndices.length
        //while(idx--) count += this.nodesByIndex[this.nodeIndices[idx]].objectCountEnd
        //return count
    },
    get objectCountStart(){
        let count = this.objects.length,
            parent = this
        while(parent = parent.parent)
            count += parent.objects.length
        return count
    }	
}

export {Octree}