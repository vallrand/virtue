import {factory, Signal} from '../../util'

const isPowOf2 = value => value && (value & (value - 1)) === 0

const WRAP_MODE = {
    REPEAT: 0,
    CLAMP: 1,
    MIRRORED_REPEAT: 2,
    set: (S, T) => S | T << 4
}

const FILTERING_MODE = {
    NONE: 0,
    LINEAR: 1,
    NEAREST: 2,
    set: (mag, min, mipmap) => (mag || 1) | (min || 1) << 2 | (mipmap || 0) << 4
}

factory.declare('texture', (target, { ctx, yFlip, premultiplyAlpha, cube }) => {
	const gl = ctx.gl,
          texture = gl.createTexture()
    let width = 0, height = 0, channels = 0, powOf2 = false, format = null, byteSize = null, 
        filteringMode = 0, wrapMode = 0
    
    gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!yFlip)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premultiplyAlpha)
    
	return {
        get cube(){ return cube },
        get glPointer(){ return texture },
        get width(){ return width },
        get height(){ return height },
        bind: (location = 0) => (!ctx.onBind('texture'+location, target) ||
            (ctx.textureLocation = location, gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture)), target),
        unbind: (location = ctx.textureLocation) => (ctx.onBind('texture'+location, null), gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, null), target),
        setTextureParameters: parameters => (Object.keys(parameters).forEach(param => target[param] = parameters[param]), target),
        clear: _ => gl.deleteTexture(texture),
        set wrapMode(value){
            wrapMode = value
            const wrapS = value & 0xF, wrapT = value >> 4,
                  glWrapS = (wrapS === WRAP_MODE.CLAMP && gl.CLAMP_TO_EDGE) || (wrapS === WRAP_MODE.MIRRORED_REPEAT && gl.MIRRORED_REPEAT) || gl.REPEAT,
                  glWrapT = (wrapT === WRAP_MODE.CLAMP && gl.CLAMP_TO_EDGE) || (wrapT === WRAP_MODE.MIRRORED_REPEAT && gl.MIRRORED_REPEAT) || gl.REPEAT
            gl.texParameteri(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrapS)
            gl.texParameteri(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrapT)
        },
        set filteringMode(value){
            filteringMode = value
            const filterMag = value & 0x7, filterMin = value >> 2, mipMaps = value >> 4,
                  glFilterMag = (filterMag === FILTERING_MODE.NEAREST && gl.NEAREST) || gl.LINEAR,
                  glFilterMin = mipMaps ? (
                      mipMaps === FILTERING_MODE.NEAREST ? (
                          (filterMin === FILTERING_MODE.NEAREST && gl.NEAREST_MIPMAP_NEAREST) || gl.LINEAR_MIPMAP_NEAREST) 
                      : ((filterMin === FILTERING_MODE.NEAREST && gl.NEAREST_MIPMAP_LINEAR) || gl.LINEAR_MIPMAP_LINEAR))
            : ((filterMin === FILTERING_MODE.NEAREST && gl.NEAREST) || gl.LINEAR)
            if(mipMaps) gl.generateMipmap(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D)
            gl.texParameteri(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, glFilterMag)
            gl.texParameteri(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, glFilterMin)
        },
        get wrapMode(){ return wrapMode },
        get filteringMode(){ return filteringMode },
        upload: source => {
            width = source.naturalWidth
            height = source.naturalHeight
            
            gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture)
            if(!cube) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
            else for(let face = 0; face < 6; face++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source[face])
            target.url = source.src
            
            return target.autoDetectTexParameters()
        },
        autoDetectTexParameters: _ => {
            if(ctx.onBind('texture'+ctx.textureLocation, target)) gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture)
            
            powOf2 = isPowOf2(width) && isPowOf2(height)
            target.filteringMode = powOf2 ? 
                FILTERING_MODE.set(FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR)
            : FILTERING_MODE.set(FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR)
            if(!powOf2) target.wrapMode = WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP)
            return target
        },
        uploadSubTexture: (src, xOffset, yOffset, subWidth, subHeight, bufferOffset, bufferLength) => {
            const subTextureView = new Uint8Array(src.buffer, src.byteOffset + bufferOffset * channels * Uint8Array.BYTES_PER_ELEMENT, bufferLength * channels)
            if(ctx.onBind('texture'+ctx.textureLocation, target)) gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texSubImage2D(gl.TEXTURE_2D, 0, xOffset, yOffset, subWidth, subHeight, format, byteSize, subTextureView)
        },
        uploadTexture: (src, params = {}, taskManager, maxChunkSize = 256) => {
            channels = params.channels || ((params.format === gl.RGBA && 4) || (params.format === gl.RGB && 3) || 3)
            format = params.format || (channels === 3 ? gl.RGB : (channels === 1 ? gl.ALPHA : gl.RGBA))
            byteSize = params.byteSize || gl.UNSIGNED_BYTE
            width = params.width || 1
            height = params.height || 1
            
            ctx.onBind('texture'+ctx.textureLocation, target)
            gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture)
            
            if(!taskManager){
                if(!cube) gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, byteSize, src)
                else for(let face = 0; face < 6; face++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, format, width, height, 0, format, byteSize, src && src[face])
                return target
            }
            if(cube) throw new Error(`Async upload not supported for Cube Maps.`)
            gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, byteSize, null)
            
            const colMaxSize = Math.floor(maxChunkSize / width) || 1,
                  rowMaxSize = Math.min(maxChunkSize, width),
                  uploadEvent = Signal()
            
            for(let colOffset = 0; colOffset < height; colOffset += colMaxSize)
                for(let rowOffset = 0; rowOffset < width; rowOffset += rowMaxSize){
                    const subWidth = Math.min(width - rowOffset, rowMaxSize),
                          subHeight = Math.min(height - colOffset, colMaxSize),
                          bufferOffset = rowOffset + colOffset * width,
                          bufferLength = subWidth * subHeight
                    taskManager.schedule(target.uploadSubTexture.bind(target, src, rowOffset, colOffset, subWidth, subHeight, bufferOffset, bufferLength))
                }
            taskManager.schedule(_ => uploadEvent.onSuccess(target.autoDetectTexParameters()))
            return uploadEvent
        },
        get format(){ return format },
        get byteSize(){ return byteSize },
        copy: texture => target.uploadTexture(null, {format: texture.format, byteSize: texture.byteSize, width: texture.width, height: texture.height})
        .setTextureParameters({wrapMode: texture.wrapMode, filteringMode: texture.filteringMode}).unbind()
	}
})

export {WRAP_MODE, FILTERING_MODE}