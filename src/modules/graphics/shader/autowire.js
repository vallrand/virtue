import {vec2, vec3, vec4, mat4} from '../../math'

const Autowire = root => {
    const unfold = (prefix, node) => Object.keys(node).map(key => {
        let value = node[key],
            address = `${prefix}${ isNaN(key) ? `.${key}` : `[${key}]` }`
        if(typeof value === 'function') return null
        if(typeof value === 'number') return `if(!isNaN(src${address}))dst${address}=src${address};`
        if(value.buffer instanceof ArrayBuffer) return `if(src${address})dst${address}=src${address};`
        if(typeof value === 'object') return `if(src${address}){${unfold(address, value)}}`
    }).join('\n')
    return new Function('dst', 'src', unfold('', root)).bind(null, root)
}

export {Autowire}