import {factory, Signal} from '../../util'
import {WRAP_MODE, FILTERING_MODE} from './texture'

factory.declare('gl_context', (target, options) => {
	const gl = target.gl,
          taskManager = options.manager
    let textureLocation = null,
        blankTexture = null
    
	return {
        get emptyTexture(){
            return blankTexture || (blankTexture = factory.build('texture', {ctx: target})
                                    .uploadTexture(new Uint8Array([0x7f,0x7f,0x7f]), {width: 1, height: 1, channels: 3})
                                    .setTextureParameters({
                wrapMode: WRAP_MODE.set(WRAP_MODE.REPEAT, WRAP_MODE.REPEAT),
                filteringMode: FILTERING_MODE.set(FILTERING_MODE.NEAREST, FILTERING_MODE.NEAREST, 0)
            }))
        },
        generateTexture: ({ data, width, height, channels = 4 }) => factory.build('texture', {ctx: target})
        .uploadTexture(new Uint8Array(data.map(pixel => pixel * 0xFF)), { width, height, channels })
        .setTextureParameters({
            wrapMode: WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP),
            filteringMode: FILTERING_MODE.set(FILTERING_MODE.LINEAR, FILTERING_MODE.LINEAR, 0)
        }).unbind(),
        uploadTexture: imageData => {
            const texture = factory.build('texture', {ctx: target})
            return texture.uploadTexture(imageData.out.data, {width: imageData.out.width, height: imageData.out.height, channels: 4 || imageData.channels}, taskManager)
                .pipe(_ => texture.unbind())
        },
        bindTextures: material => {
            if(material.length === 0) return target.emptyTexture.bind(0)
            //TODO blank texture init on location > 0 - resets tex 0 (if it is unboud after creation) //Note it was removed (unbind) for now
            material.forEach((texture, location) => texture.loaded ? texture.data.bind(location) : target.emptyTexture.bind(location))
        },
        set textureLocation(location){
            if(textureLocation !== location)
                textureLocation = (gl.activeTexture(gl.TEXTURE0 + location), location)
        },
        get textureLocation(){ return textureLocation || 0 },
        get maxTexturePrecision(){
            return (target.extensions.texture_float && target.extensions.texture_float_linear && 32) || (target.extensions.texture_half_float && target.extensions.texture_half_float_linear && 16) || 8
        }
	}
})