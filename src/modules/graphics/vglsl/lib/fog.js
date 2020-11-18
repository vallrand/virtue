import {vglsl} from '../vglsl'

const fog_exp = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    
    .const('float', 'LOG2', '1.442695')
    .uniform('float', 'fogDensity')
    .uniform('vec3', 'fogColor')
    .function('vec3 applyFog(vec3 color)', [
        'float z = gl_FragCoord.z / gl_FragCoord.w;',
        'float fogFactor = clamp(exp2( - fogDensity * fogDensity * z * z * LOG2), 0.0, 1.0);',
        'return mix(fogColor, color, fogFactor);'
    ])
}

export {fog_exp}