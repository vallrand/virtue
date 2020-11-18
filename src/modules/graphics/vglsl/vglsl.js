import {tie} from '../../util'
const vglsl = Object.create(null)

vglsl.PRECISION = {
    LOW: 'lowp',
    MEDIUM: 'mediump',
    HIGH: 'highp'
}

vglsl.createShader = _ => {
    const builder = Object.create(null)
    function insert(array, item, comparator){
        const index = array.findIndex(comparator)
        if(index == -1) array.push(item)
    }
    let precision = vglsl.PRECISION.MEDIUM,
        extensions = [],
        structs = [],
        constants = [],
        functions = [],
        uniforms = [],
        varyings = [],
        attributes = [],
        main = []
    
    return tie(builder, {
        get precision(){ return precision },
        setPrecision: p => (precision = p, builder),
        extension: name => (insert(extensions, name, e => e === e), builder),
        const: (type, name, value) => (insert(constants, {type, name, value}, c => c.name === name), builder),
        struct: (name, params) => (insert(structs, {name, params}, s => s.name === name), builder),
        function: (head, body) => (insert(functions, {head, body}, f => f.head === head), builder),
        uniform: (type, name) => (insert(uniforms, {type, name}, u => u.name === name), builder),
        varying: (type, name) => (insert(varyings, {type, name}, v => v.name === name), builder),
        attribute: (type, name) => (insert(attributes, {type, name}, a => a.name === name), builder),
        main: body => (main = body, builder),
        append: (target, out = vglsl.createShader()) => {
            if(target) target.append(null, out)
            out.setPrecision(precision)
            extensions.forEach(e => out.extension(e))
            structs.forEach(s => out.struct(s.name, s.params))
            constants.forEach(c => out.const(c.type, c.name, c.value))
            functions.forEach(f => out.function(f.head, f.body))
            uniforms.forEach(u => out.uniform(u.type, u.name))
            varyings.forEach(v => out.varying(v.type, v.name))
            attributes.forEach(a => out.attribute(a.type, a.name))
            if(main.length) out.main(main)
            return out
        },
        build: _ => [].concat.apply([], [
            extensions.map(e => `#extension ${e} : enable`),
            [[`precision ${precision} float;`]],
            attributes.map(a => `attribute ${a.type} ${a.name};`),
            structs.map(s => `struct ${s.name} {${s.params.join(';')};};`),
            constants.map(c => `const ${c.type} ${c.name} = ${c.value};`),
            varyings.map(v => `varying ${v.type} ${v.name};`),
            uniforms.map(u => `uniform ${u.type} ${u.name};`),
            functions.map(f => `${f.head}{${f.body.join('\n')}}`),
            [`void main(void){${main.join('\n')}}`]
        ]).join('\n')
    })
}

vglsl.merge = (...shaders) => shaders.reduce((a, b) => ({
    vert: (a.vert && b.vert && b.vert.append(a.vert)) || a.vert || b.vert,
    frag: (a.frag && b.frag && b.frag.append(a.frag)) || a.frag || b.frag
}), {})

export {vglsl}