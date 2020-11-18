Math.clamp = (v, min, max) => v < min ? min : v > max ? max : v
Math.mod = (n, m) => ((n % m) + m) % m

const unrollVectorBinaryOperator = (length, defaultValue, operator, callable = false) => new Function('v0', 'v1', 'out', 
[`out = out || this()`]
.concat(Array(length).fill().map((_, idx) => callable ?
`out[${idx}] = ${operator}(v0[${idx}],v1[${idx}])` : `out[${idx}] = v0[${idx}] ${operator} v1[${idx}]`))
.concat('return out').join(';')).bind(defaultValue)
const unrollVectorScalarOperator = (length, defaultValue, operator, callable = false) => new Function('v0', 's', 'out', 
[`out = out || this()`]
.concat(Array(length).fill().map((_, idx) => callable ? 
`out[${idx}] = ${operator}(v0[${idx}],s)` : `out[${idx}] = v0[${idx}] ${operator} s`))
.concat('return out').join(';')).bind(defaultValue)
const unrollVectorUnaryOperator = (length, defaultValue, operator, callable = false) => new Function('v0', 'out', 
[`out = out || this()`]
.concat(Array(length).fill().map((_, idx) => callable ? 
`out[${idx}] = ${operator}(v0[${idx}])` : `out[${idx}] = ${operator} v0[${idx}]`))
.concat('return out').join(';')).bind(defaultValue)

const lerp = (v1, v2, f) => v1 + f * (v2 - v1)

const generateUUID = (rng => {
    let id = 0
    return _ => ++id
    
    const lookupTable = Array(256).fill().map((_, i) => (i<16?'0':'') + i.toString(16))
    const randomNumbers = new Uint32Array(4)
    const formatUUID = ([d0, d1, d2, d3]) => lookupTable[d0&0xFF]+lookupTable[d0>>8&0xFF]+lookupTable[d0>>16&0xFF]+lookupTable[d0>>24&0xFF]
    +'-'+lookupTable[d1&0xFF]+lookupTable[d1>>8&0xFF]
    +'-'+lookupTable[d1>>16&0x0F|0x40]+lookupTable[d1>>24&0xFF]
    +'-'+lookupTable[d2&0x3F|0x80]+lookupTable[d2>>8&0xFF]
    +'-'+lookupTable[d2>>16&0xFF]+lookupTable[d2>>24&0xFF]+lookupTable[d3&0xFF]+lookupTable[d3>>8&0xFF]+lookupTable[d3>>16&0xFF]+lookupTable[d3>>24&0xFF]
    return _ => {
        randomNumbers[0] = Math.random()*0x100000000 >>> 0
        randomNumbers[1] = Math.random()*0x100000000 >>> 0
        randomNumbers[2] = Math.random()*0x100000000 >>> 0
        randomNumbers[3] = Math.random()*0x100000000 >>> 0
        return formatUUID(randomNumbers)
    }
})(Math.random)

export function greatestCommonDivisor(a, b){
	a = Math.abs(a)
	b = Math.abs(b)
	while(b > 1e-6){
		let temp = b
		b = a % b
		a = temp
	}
	return a
}

export {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator, lerp, generateUUID}