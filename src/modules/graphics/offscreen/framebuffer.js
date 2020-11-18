import {factory, tie} from '../../util'
import {vec3} from '../../math'
import {WRAP_MODE, FILTERING_MODE} from '../texture'

//TODO depth tex, etc. Check for depth support?
factory.declare('fbo', (target, options) => {
    const gl = options.ctx.gl,
          framebuffer = gl.createFramebuffer(),
          renderbuffer = gl.createRenderbuffer()
    let textures = [],
        faces = [],
        depthTexture = null
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)   
    framebuffer.width = options.width
    framebuffer.height = options.height
    
    return {
        get width(){ return options.width },
        get height(){ return options.height },
        get attachedTextures(){ return textures },
        get attachedDepthTexture(){ return depthTexture },
        bind: resize => {
            if(options.ctx.onBind('fbo', target))
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
            if(resize) options.ctx.viewport = [options.width, options.height]
            return target
        },
        unbind: _ => {
            options.ctx.onBind('fbo', null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            return target
        },
        attachStencil: texture => {
            target.bind()
            return target
        },
        attachDepth: texture => {
            if(depthTexture === texture) return target
            target.bind()
            if(texture){
                depthTexture = texture = texture === true ? factory.build('texture', {ctx: options.ctx})
                .uploadTexture(null, {width: options.width, height: options.height, format: gl.DEPTH_COMPONENT, byteSize: gl.UNSIGNED_SHORT})// ::ALTERNATIVE:: gl.UNSIGNED_INT
                .setTextureParameters({
                    wrapMode: WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP),
                    filteringMode: FILTERING_MODE.set(FILTERING_MODE.NEAREST, FILTERING_MODE.NEAREST, 0)
                }).unbind() : texture
                
                if(texture.width !== options.width || texture.height !== options.height)
                    throw new Error('Texture dimenstions do not match Framebuffer!')
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture.glPointer, 0)
            }else{
                gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, options.width, options.height)
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)
                gl.bindRenderbuffer(gl.RENDERBUFFER, null)
            }
            if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) //TODO IMPORTANT optimisation, this is a bottleneck. Defer checking status
                throw new Error('Incomplete Framebuffer')
            return target
        },
        attachTexture: (texture, location = 0, face) => {
            if(textures[location] === texture && faces[location] == face) return target
            faces[location] = face
            textures[location] = texture = texture || factory.build('texture', { ctx: options.ctx })
                .uploadTexture(null, { width: options.width, height: options.height, format: gl.RGBA })
                .setTextureParameters({
                    wrapMode: WRAP_MODE.set(WRAP_MODE.CLAMP, WRAP_MODE.CLAMP),
                    filteringMode: FILTERING_MODE.set(FILTERING_MODE.NEAREST, FILTERING_MODE.NEAREST, 0)
                }).unbind()
            
            if(texture.width !== options.width || texture.height !== options.height)
                throw new Error('Texture dimenstions do not match Framebuffer!')
            target.bind()
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + location, texture.cube ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + face : gl.TEXTURE_2D, texture.glPointer, 0)
            if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) //TODO IMPORTANT optimisation, this is a bottleneck. Defer checking status
                throw new Error('Incomplete Framebuffer')
            return target
        },
        clear: _ => {
            gl.deleteFramebuffer(framebuffer)
            gl.deleteRenderbuffer(renderbuffer)
        }
    }
})
            
//COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture
//COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_ATTACHMENT = DEPTH_COMPONENT16 renderbuffer
//COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_STENCIL_ATTACHMENT = DEPTH_STENCIL renderbuffer