import {tie} from '../../util'

//TODO Async stream / split sorting algorithm

const BinPacker = (sort = BinPacker.sort.maxside, maxWidth, maxHeight = maxWidth) => {
    const target = Object.create(null)
    let root = { x: 0, y: 0, w: maxWidth || 0, h: maxHeight || 0 },
        node = null
    
    return tie(target, {
        get root(){ return root },
        insert: (blocks) => blocks.sort(sort).forEach(block => {
            root.w = root.w || block.w
            root.h = root.h || block.h
            
            if(node = target.findNode(root, block.w, block.h))
                block.fit = target.splitNode(node, block.w, block.h)
            else if(!maxHeight)
                block.fit = target.growNode(block.w, block.h)
        }),
        findNode: (root, w, h) => root.full ? (target.findNode(root.right, w, h) || target.findNode(root.down, w, h)) : (w <= root.w && h <= root.h ? root : null),
        splitNode: (node, w, h) => Object.assign(node, {
            full: true,
            down: {     x: node.x,      y: node.y + h,  w: node.w,      h: node.h - h },
            right: {    x: node.x + w,  y: node.y,      w: node.w - w,  h: h }
        }),
        growNode: (w, h) => (h <= root.h && root.w < root.h + h) ? target.growRight(w, h) : (w <= root.w ? target.growDown(w, h) : null),
        growRight: (w, h) => (root = { full: true, x: 0, y: 0,
                w: root.w + w,
                h: root.h,
                down: root,
                right: {x: root.w, y: 0, w: w, h: root.h}
            }, (node = target.findNode(root, w, h)) ? target.splitNode(node, w, h) : null),
        growDown: (w, h) => (root = { full: true, x: 0, y: 0,
                w: root.w,
                h: root.h + h,
                down: {x: 0, y: root.h, w: root.w, h: h},
                right: root
            }, (node = target.findNode(root, w, h)) ? target.splitNode(node, w, h) : null),
        clear: _ => (root = { x: 0, y: 0, w: maxWidth || 0, h: maxHeight || 0 }, target)
    })
}

BinPacker.sort = {
    random: (a, b) => Math.random() - 0.5,
    height: (a, b) => b.h - a.h || b.w - a.w,
    width: (a, b) => b.w - a.w || b.h - a.h,
    area: (a, b) => (b.w*b.w+b.h*b.h) - (a.w*a.w+a.h*a.h) || BinPacker.sort.height(a, b),
    maxside: (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || Math.min(b.w, b.h) - Math.min(a.w, a.h) || BinPacker.sort.height(a, b)
}

export {BinPacker}