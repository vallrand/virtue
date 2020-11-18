import {vglsl} from '../vglsl'

const dilate = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    
    .function('vec4 extrude(sampler2D source, vec2 uv, vec2 invResolution, float offset)', [
        'vec4 total = texture2D(source, uv);',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2(-offset, -offset));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2( 0.0, -offset));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2( offset, -offset));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2(-offset,  0.0));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2( offset,  0.0));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2(-offset,  offset));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2( 0.0,  offset));',
        'total = total.a > 0.0 ? total : texture2D(source, uv + invResolution * vec2( offset,  offset));',
        'return total;'
    ])
    
    .main([
        'gl_FragColor = extrude(sampler, uvPass, pixelSize, 1.0);'
    ])
}


export {dilate}