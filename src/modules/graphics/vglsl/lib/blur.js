import {vglsl} from '../vglsl'

const box_blur = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    .function('float random(vec3 scale,float seed)', ['return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);'])
    
    .function('vec4 gaussian_x9(sampler2D image, vec2 uv, vec2 invResolution, vec2 direction)', [
        'vec4 color = vec4(0.0);',
        'vec2 off1 = vec2(1.3846153846) * direction;',
        'vec2 off2 = vec2(3.2307692308) * direction;',
        'color += texture2D(image, uv) * 0.2270270270;',
        'color += texture2D(image, uv + (off1 * invResolution)) * 0.3162162162;',
        'color += texture2D(image, uv - (off1 * invResolution)) * 0.3162162162;',
        'color += texture2D(image, uv + (off2 * invResolution)) * 0.0702702703;',
        'color += texture2D(image, uv - (off2 * invResolution)) * 0.0702702703;',
        'return color;',
    ])
    
    .function('vec4 simple_box_x9(sampler2D image, vec2 uv, vec2 invResolution)', [
        'vec4 total = vec4(0.0);',
        'for(int x=-1; x<=1; x++){ for(int y=-1; y<=1; y++){',
        '   total += texture2D(image, uv + vec2(float(x), float(y)) * invResolution);',
        '}}',
        'return total / 9.0;'
    ])
    
    .function('vec4 box_x9(sampler2D image, vec2 uv, vec2 invResolution, vec2 delta)', [
        'vec4 total = vec4(0.0);',
        'vec2 offset = delta * invResolution;',
        'total += texture2D(image, (uv - offset * 4.0)) * 0.051;',
        'total += texture2D(image, (uv - offset * 3.0)) * 0.0918;',
        'total += texture2D(image, (uv - offset * 2.0)) * 0.12245;',
        'total += texture2D(image, (uv - offset * 1.0)) * 0.1531;',
        'total += texture2D(image, (uv + offset * 0.0)) * 0.1633;',
        'total += texture2D(image, (uv + offset * 1.0)) * 0.1531;',
        'total += texture2D(image, (uv + offset * 2.0)) * 0.12245;',
        'total += texture2D(image, (uv + offset * 3.0)) * 0.0918;',
        'total += texture2D(image, (uv + offset * 4.0)) * 0.051;',
        'return total;'
    ])
    
    .main([
        'gl_FragColor = box_x9(sampler, uvPass, pixelSize, vec2(0.25));'
    ])
}


export {box_blur}