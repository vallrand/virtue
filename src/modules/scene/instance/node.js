import { factory, Stream } from '../../util'
import { vec3, quat, mat4 } from '../../math'

//TODO bounding radius should be based on children ??

export const Node = (target, options) => {
    const nodes = []
    let parent = null
    
    target.onCleanup(_ => {
        let idx = nodes.length
        while(idx--) nodes[idx].delete()
        parent && parent.removeElement(target)
    })
    
    target.mutation.attach(event => {
        let idx = nodes.length
        while(idx--) nodes[idx].propagate(event)
    }, null, false)
    
    return {
        get parent(){ return parent },
        set parent(value){ parent = value },
        get root(){
            let root = target
            while(root.parent) root = root.parent
            return root
        },
        get elements(){ return nodes },
        addElement: (...elements) => (elements.forEach(element => {
            if(element.parent) element.parent.removeElement(element)
            nodes.push(element)
            element.parent = target
            element.propagate(0, target, element)
        }), target),
        removeElement: (...elements) => (elements.forEach(element => {
            let idx = nodes.indexOf(element)
            if(idx == -1) return false
            nodes.splice(idx, 1)
            element.parent = null
            element.propagate(0, null, element)
        }), target)
    }
}