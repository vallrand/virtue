import {vglsl} from '../vglsl'

const geometry = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    .attribute('vec3', 'normal')
    .attribute('vec2', 'uv')
    
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'modelViewMatrix')
    
    .varying('vec3', 'normalPass')
    .varying('vec2', 'uvPass')
    
    .main([
        'mat4 transformMatrix = modelViewMatrix * calcJointTransform();',
        'vec4 viewPosition = transformMatrix * vec4(position, 1.0);',
        'normalPass = vec3(transformMatrix * vec4(normal, 0.0));',
        'uvPass = uv;',
        'gl_Position = projectionMatrix * viewPosition;',
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'normalPass')
    .varying('vec2', 'uvPass')
    
    .uniform('sampler2D', 'albedo')
    .uniform('vec3', 'highlightColor')
    
    .main([
        'vec3 normal = normalize(normalPass);',
        'vec4 color = texture2D(albedo, uvPass);',
        'vec3 light = normalize(vec3(  0.5,  0.2,  1.0));',
        'float amount = max(dot(normalPass, light),  0.0);',
        'color = vec4(applyFog(color.rgb * highlightColor), 1.0);',
        'gl_FragColor = color;'
    ])
}
export {geometry}