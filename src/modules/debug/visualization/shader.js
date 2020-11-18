import {vglsl} from '../../graphics/vglsl'

const flat_color = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    .attribute('vec3', 'normal')
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'modelViewMatrix')
    .varying('vec3', 'normalPass')
    
    .main([
        'vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);',
        'vec4 viewNormal = modelViewMatrix * vec4(normal, 0.0);',
        'normalPass = viewNormal.xyz;',
        'gl_Position = projectionMatrix * viewPosition;'
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'normalPass')
    .uniform('vec3', 'color')
    .main([
        'vec3 normal = normalize(normalPass);',
        'vec3 lightDirection = normalize(vec3(-1,1,1));',
        'float lightFactor = 0.5 + 0.5 * dot(normal, lightDirection);',
        'gl_FragColor = vec4(lightFactor * color, 1.0);'
    ])
}

export {flat_color}