import {PairsArray} from './broadphase'

const SAPMarker = (value, pointer, sign, connections) => ({ value, pointer, sign, connections, prev: null }) //TODO use pool? and static array allocation

const SAPAxis = _ => {
    const markers = []
    const stack = [] //TODO use typed array, resize on add/remove
    
    return {
        markers,
        get count(){ return markers.length },
        addMarker: (min, max, pointer, connections) => {
            let lowerMarker = SAPMarker(min, pointer, -1, connections)
            let upperMarker = SAPMarker(max, pointer, +1, connections)
            markers.push(lowerMarker, upperMarker)
            connections.push(lowerMarker, upperMarker)
        },
        removeMarker: (pointer) => {
            for(let i = markers.length - 1; i >= 0; i--)
                if(markers[i].pointer === pointer)
                    markers.splice(i, 1)
        },
        sort: _ => {
            const length = markers.length
            insertion_sort: {
                let threshold = 0
                while((length >> ++threshold) != 0);
                threshold *= length >> 2
                
                for(let i = 1; i < length; i++){
                    let j, marker = markers[i],
                        pivot = marker.value
                    for(j = i - 1; j >= 0; j--){
                        if(markers[j].value <= pivot) break
                        markers[j + 1] = markers[j]
                    }
                    markers[j + 1] = marker
                    if((threshold -= i-j) < 0) break insertion_sort
                }
                return true
            }
            quick_sort: {
                stack.push(0, length-1)
                while(stack.length){
                    let right = stack.pop(),
                        left = stack.pop(),
                        pivot = markers[(left + right) >> 1].value,
                        i = left,
                        j = right
                    //TODO while(true)
                    while(i <= j){
                        while(markers[i].value < pivot) i++
                        while(markers[j].value > pivot) j--
                        if(i > j) break
                        let temp = markers[i]
                        markers[i] = markers[j]
                        markers[j] = temp
                        i++
                        j--
                    }
                    if(i < right) stack.push(i, right)
                    if(left < i - 1) stack.push(left, i-1)
                }
                return true
            }
        },
        calculateTestCount: _ => {
            let count = 1,
                total = 0
            for(let length = markers.length, i = 1; i < length; i++)
                markers[i].sign > 0 ? count-- : total += count++
            return total
        }
    }
}

const SweepAndPruneBroadphase = ({checkCollisionFlags, testCollision}) => {
    const broadphase = Object.create(null)
    const dynamicAxes = [SAPAxis(), SAPAxis(), SAPAxis()]
    const staticAxes = [SAPAxis(), SAPAxis(), SAPAxis()]
    const linkedQueue = [{prev: null}, {prev: null}]
    
    let index0 = 0,
        index1 = 1,
        index2 = 2
    
    return Object.assign(broadphase, {
        update: _ => {
            const staticMarkers = staticAxes[0].markers,
                  dynamicMarkers = dynamicAxes[0].markers
            for(let i = staticMarkers.length - 1; i >= 0; i--){
                let marker = staticMarkers[i]
                if(marker.sign > 0) continue
                if(!marker.pointer.dynamic) continue
                broadphase.remove(marker.pointer, false)
                broadphase.add(marker.pointer)
            }
            for(let i = dynamicMarkers.length - 1; i >= 0; i--){
                let marker = dynamicMarkers[i]
                if(marker.sign > 0) continue
                if(marker.pointer.dynamic){
                    let body = marker.pointer,
                        connections = marker.connections
                    connections[0].value = body.aabb.lowerBound[0]
                    connections[1].value = body.aabb.upperBound[0]
                    connections[2].value = body.aabb.lowerBound[1]
                    connections[3].value = body.aabb.upperBound[1]
                    connections[4].value = body.aabb.lowerBound[2]
                    connections[5].value = body.aabb.upperBound[2]
                }else{
                    broadphase.remove(marker.pointer, true)
                    broadphase.add(marker.pointer)
                }
            }
        },
        add: (body, dynamic = body.dynamic) => {
            const connections = []
            if(dynamic){
                dynamicAxes[0].addMarker(body.aabb.lowerBound[0], body.aabb.upperBound[0], body, connections)
                dynamicAxes[1].addMarker(body.aabb.lowerBound[1], body.aabb.upperBound[1], body, connections)
                dynamicAxes[2].addMarker(body.aabb.lowerBound[2], body.aabb.upperBound[2], body, connections)
            }else{
                staticAxes[0].addMarker(body.aabb.lowerBound[0], body.aabb.upperBound[0], body, connections)
                staticAxes[1].addMarker(body.aabb.lowerBound[1], body.aabb.upperBound[1], body, connections)
                staticAxes[2].addMarker(body.aabb.lowerBound[2], body.aabb.upperBound[2], body, connections)
            }
        },
        remove: (body, dynamic = body.dynamic) => {
            if(dynamic){
                dynamicAxes[0].removeMarker(body)
                dynamicAxes[1].removeMarker(body)
                dynamicAxes[2].removeMarker(body)
            }else{
                staticAxes[0].removeMarker(body)
                staticAxes[1].removeMarker(body)
                staticAxes[2].removeMarker(body)
            }
        },
        queryCandidates: (pairs = PairsArray()) => {
            broadphase.update()
            
            let axis0 = dynamicAxes[index0],
                axis1 = dynamicAxes[index1]
            axis0.sort()
            axis1.sort()
            if(axis0.calculateTestCount() >= axis1.calculateTestCount())
                index0 = index1 + (index1 = index0, 0)
            let dynamicAxis = dynamicAxes[index0],
                staticAxis = staticAxes[index0]
            staticAxis.sort()
            
            linkedQueue[0].prev = null
            linkedQueue[1].prev = null
            for(let marker, queueIndex, s = 0, d = 0; d < dynamicAxis.count;){
                queueIndex = +(s == staticAxis.count || staticAxis.markers[s].value >= dynamicAxis.markers[d].value)
                marker = queueIndex ? dynamicAxis.markers[d++] : staticAxis.markers[s++]

                if(marker.sign > 0){
                    let min = marker.connections[index0 * 2],
                        prev, node = linkedQueue[queueIndex]
                    while(prev = node.prev){
                        if(prev === min){
                            node.prev = min.prev
                            min.prev = null
                            break
                        }
                        node = prev
                    }
                    continue
                }
                
                let connections = marker.connections,
                    bodyA = marker.pointer
                for(let node = linkedQueue[1].prev; node != null; node = node.prev){
                    if(connections[index1 * 2] > node.connections[index1 * 2 + 1] ||
                       connections[index1 * 2 + 1] < node.connections[index1 * 2] ||
                       connections[index2 * 2] > node.connections[index2 * 2 + 1] || 
                       connections[index2 * 2 + 1] < node.connections[index2 * 2]) continue

                    if(!checkCollisionFlags(bodyA, node.pointer)) continue
                    if(testCollision(bodyA, node.pointer)) pairs.add(bodyA, node.pointer)
                }
                if(queueIndex)
                for(let node = linkedQueue[0].prev; node != null; node = node.prev){
                    if(connections[index1 * 2] > node.connections[index1 * 2 + 1] ||
                       connections[index1 * 2 + 1] < node.connections[index1 * 2] ||
                       connections[index2 * 2] > node.connections[index2 * 2 + 1] || 
                       connections[index2 * 2 + 1] < node.connections[index2 * 2]) continue

                    if(!checkCollisionFlags(bodyA, node.pointer)) continue
                    if(testCollision(bodyA, node.pointer)) pairs.add(bodyA, node.pointer)
                }
                marker.prev = linkedQueue[queueIndex].prev
                linkedQueue[queueIndex].prev = marker
            }
            index1 = index2 + (index2 = index1, 0)
            return pairs
        }
    })
}


export {SweepAndPruneBroadphase}