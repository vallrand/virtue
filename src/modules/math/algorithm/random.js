const rngMultiplyWithCarry = (seed = 123456789) => {
    const mask = 0xFFFFFFFF
    let w = seed,
        z = 987654321
    return _ => {
        z = (36969 * (z & 65535) + (z >> 16)) & mask
        w = (18000 * (w & 65535) + (w >> 16)) & mask
        return 0.5 + (((z << 16) + w) & mask) / 4294967296
    }
}

const rngLinearCongruentialGenerator = (seed = 0, range = Math.pow(2, 32), multiplier = 134775813) => 
_ => (seed = (multiplier * seed + 1) % range) / range

const rngSimple = (seed = 1) => 
_ => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
}

Math.random = rngSimple()

export {rngMultiplyWithCarry, rngLinearCongruentialGenerator, rngSimple}