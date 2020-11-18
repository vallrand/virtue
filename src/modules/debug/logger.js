import {snapshot} from '../util'

//TODO filtering, DEBUG etc
const logger = (target => {
    const history = [],
          styles = Object.create(null),
          filter = []
    
    return Object.assign(target, {
        filter,
        info: (style, ...args) => {
            if(window.DEBUG && filter.indexOf(style) == -1)
                args.forEach(msg => typeof msg === 'object' ? console.dir(msg) : styles[style] ? console.log('%c' + msg, styles[style]) : console.log(msg))
            return target
        },
        registerStyle: (style, cssText) => (styles[style] = cssText, target)
    })
})(Object.create(null))

logger
    .registerStyle('webgl', 'color:#22cc9c;background:#111;border-bottom:4px solid #779977')
    .registerStyle('loader', 'color:#000099;background:#ccffff')
    .registerStyle('buffer', 'color:#357235;text-decoration:underline')
    .registerStyle('memory', 'color:#ac33bb;font-style:italic')
    .registerStyle('lightmap', 'color:#5588CC')
    .registerStyle('navigation', 'color:#002266;text-shadow:0px 0px 1px #bbffbb')
    .registerStyle('ai', 'color:#af3814;border-bottom:1px solid #444444')
    .registerStyle('fx', 'color:#663399;font-size:8pt;border-bottom:1px #663399 dashed')
    .registerStyle('spatial', 'color:#e73d4d;font-weight:bold;text-shadow:0px 0px 1px #000000')

//logger.filter.push('loader', 'buffer', 'lightmap')

export {logger}