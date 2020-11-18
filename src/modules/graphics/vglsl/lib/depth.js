import {vglsl} from '../vglsl'

const depth = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    .attribute('vec3', 'normal')
    
    .uniform('mat4', 'viewMatrix')
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'modelMatrix')
    
    .main([
        'vec4 screenPosition = viewMatrix * modelMatrix * vec4(position, 1.0);',
        'vec4 screenNormal = normalize(viewMatrix * modelMatrix * vec4(normal, 0.0));',
        'vec3 lightDirection = normalize(screenPosition.xyz);',
        'screenPosition -= screenNormal * 16.0 * max(dot(screenNormal.xyz, lightDirection), 0.0);',
        'gl_Position = projectionMatrix * screenPosition;',
    ]),
    frag: vglsl.createShader()
    .main([ 'gl_FragColor = vec4(0.0,0.0,0.0,0.0);' ])
}

const encodedDepth = {
    vert: vglsl.createShader()
    .const('vec4', 'bitShift', 'vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0)')
    .const('vec4', 'bitMask', 'vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0)')
    .function('vec4 packDepth(float depth)', [
        'vec4 rgbaDepth = fract(depth * bitShift);',
        'rgbaDepth -= rgbaDepth.gbaa * bitMask;',
        'return rgbaDepth;'
    ])
    
    .const('vec4', 'bitShift', 'vec4(1.0, 1.0/256.0, 1.0/(256.0 * 256.0), 1.0/(256.0*256.0*256.0))')
    .function('float unpackDepth(vec4 rgbaDepth)', [
        'return dot(rgbaDepth * bitShift);'
    ])
}

export {depth}