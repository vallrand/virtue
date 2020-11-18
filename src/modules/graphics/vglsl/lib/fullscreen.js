import { vglsl } from '../vglsl'

export const fullscreen = {
    vert: vglsl.createShader()
    .attribute('vec2', 'uv')
    .varying('vec2', 'uvPass')
    .main([
        'uvPass = uv;',
        'gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);',
    ]),
    frag: vglsl.createShader()
    .varying('vec2', 'uvPass')
    .uniform('sampler2D', 'sampler')
    .uniform('vec2', 'pixelSize')
    .main([
        'gl_FragColor = texture2D(sampler, uvPass);'
    ])
}
//TODO rename and move to skybox
export const fullscreen_cube = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'modelViewMatrix')
    
    .varying('vec3', 'uvPass')
    .main([
        'uvPass = position;',
        'gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));',
        'gl_Position.z = gl_Position.w;'
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'uvPass')
    .uniform('samplerCube', 'sampler')
    .main([
        'gl_FragColor = textureCube(sampler, uvPass);'
    ])
}