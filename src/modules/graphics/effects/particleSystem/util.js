import {tie} from '../../../util'

const CORNERS = [
    [-0.5, -0.5],
    [+0.5, -0.5],
    [+0.5, +0.5],
    [-0.5, +0.5]
]

const InterleavedArrayIterator = (requireArray, format) => {
    const iterator = Object.create(null),
          stride = format.reduce((size, property) => (property[2] = size) + (property[3] = property[1].length || 1), 2),
          arrayPointer = typeof requireArray === 'function' ? requireArray(4  * stride) : requireArray
    let arrayOffset = 0
    format.forEach(property => property[0] && Object.defineProperty(iterator, property[0], {
        set: new Function('array', 'value', `var i=this.offset+${property[2]};${Array(4)
                          .fill(property[3] > 1 ? Array.range(property[3]).map(i => `array[i+${i}] = value[${i}];`).join('') : 'array[i] = value;')
                          .join(`i+=${stride};`)}`)
        .bind(iterator, arrayPointer),
        get: new Function('array', `var i=this.offset+${property[2]};return array.slice(i,i+${property[3]})${property[3] == 1 ? '[0]' : ''};`)
        .bind(iterator, arrayPointer)
    }))
    
    return tie(iterator, {
        set index(value){ arrayOffset = value * stride * 4 },
        get stride(){ return 4 * stride },
        get offset(){ return arrayOffset },
        get array(){ return arrayPointer },
        init: skipDefaults => {
            CORNERS.forEach((corner, i) => {
                let offset = arrayOffset + i * stride
                arrayPointer[offset + 0] = corner[0]
                arrayPointer[offset + 1] = corner[1]
            })
            if(!skipDefaults) format.forEach(property => iterator[property[0]] = property[1])
        }
    })
}

const generateParticleTexture = _ => { //TODO more options
    const pixelBase = [0, 0.2, 0.7, 1, 0.7, 0.2, 0, 0],
          size = pixelBase.length,
          pixels = []
    for(let y = 0; y < size; y++)
        for(let x = 0; x < size; x++){
            let pixel = pixelBase[x] * pixelBase[y]
            pixels.push(pixel, pixel, pixel, pixel)
        }
    return { data: pixels, width: 8, height: 8, channels: 8 } //TODO what is the format for the output?
}

const ColorRamp = (...colors) => ({
    data: colors.flatten(),
    width: colors.length,
    height: 1,
    channels: colors[0].length
})

const RangeSampler = (value, range) => {
    if(!value.length)
        return _ => value + (Math.random() - 0.5) * range * 2
    const temp = []
    return _ => {
        for(let i = value.length - 1; i >= 0; i--)
            temp[i] = value[i] + (Math.random() - 0.5) * range[i] * 2
        return temp
    }
}

export {InterleavedArrayIterator, generateParticleTexture, RangeSampler, ColorRamp}