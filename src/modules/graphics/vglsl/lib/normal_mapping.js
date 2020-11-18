import {vglsl} from '../vglsl'

const normal_mapping = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    
    .uniform('sampler2D', 'normalSpec')
    
    .extension('GL_OES_standard_derivatives')
    .function('mat3 calcTBN(vec3 normal, vec3 position, vec2 uv)', [
        'vec3 dpx = dFdx(position);',
        'vec3 dpy = dFdy(position);',
        'vec2 duvx = dFdx(uv);',
        'vec2 duvy = dFdy(uv);',
        'vec3 dpyPerp = cross(dpy, normal);',
        'vec3 dpxPerp = cross(normal, dpx);',
        'vec3 tangent = dpyPerp * duvx.x + dpxPerp * duvy.x;',
        'vec3 binormal = dpyPerp * duvx.y + dpxPerp * duvy.y;',
        'float invMax = inversesqrt(max(dot(tangent, tangent), dot(binormal, binormal)));',
        'return mat3(tangent * invMax, binormal * invMax, normal);'
    ])
    .function('vec3 pertubNormal(vec3 normal, vec3 viewDirection, vec2 uv)', [
        'vec3 mappedNormal = texture2D(normalSpec, uv).xyz;',
        'mappedNormal = mappedNormal * 255.0/127.0 - 128.0/127.0;',
        //'mappedNormal.z = sqrt( 1. - dot( mappedNormal.xy, mappedNormal.xy ) );',
        'mappedNormal.y = -mappedNormal.y;',
        'mat3 TBN = calcTBN(normal, -viewDirection, uv);',
        'return normalize(TBN * mappedNormal);'
    ])
    
    
}

export {normal_mapping}