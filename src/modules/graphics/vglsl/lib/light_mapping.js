import {vglsl} from '../vglsl'

const bake_lightmap = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    .attribute('vec3', 'normal')
    .attribute('vec2', 'lm_uv')
    
    .uniform('mat4', 'modelMatrix')

    .varying('vec3', 'viewDirectionPass')
    .varying('vec3', 'normalPass')
    
    .uniform('vec2', 'lightmapOffset')
    .uniform('vec2', 'lightmapScale') //TODO uniform scale, then pack into vec3
    
    .main([
        'vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
        'normalPass = normalize(vec4(modelMatrix * vec4(normal, 0.0)).xyz);',
        'viewDirectionPass = -worldPosition.xyz;',
        
        'setupLight(worldPosition);',
        
        'vec2 lightmapUV = lm_uv * lightmapScale + lightmapOffset;',
        'gl_Position = vec4(lightmapUV * 2.0 - 1.0, 0.5, 1.0);'
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'normalPass')
    .varying('vec3', 'viewDirectionPass')
    
    .main([
        'vec3 normal = normalize(normalPass);',
        'vec3 viewDirection = normalize(viewDirectionPass);',
        'gl_FragColor = vec4(vec3(0.2) * calcLight(normal, viewDirection), 1.0);'
    ])
}

const render_lightmap = {
    vert: vglsl.createShader()
    .attribute('vec2', 'lm_uv')
    
    .varying('vec2', 'lightmapUvPass')
    
    .uniform('vec2', 'lightmapOffset')
    .uniform('vec2', 'lightmapScale') //TODO uniform scale, then pack into vec3
    
    .function('void setupLight(void)', [
        'vec2 lightmapUV = lm_uv * lightmapScale + lightmapOffset;',
        'lightmapUvPass = lightmapUV;'
    ]),//TODO vglsl when merging maybe combine main as well?
    frag: vglsl.createShader()
    .varying('vec2', 'lightmapUvPass')
    
    .uniform('sampler2D', 'lightmap')
    
    .function('vec3 calcLighting(vec3 normal, vec3 viewDirection)', [
        'vec4 lightmapColor = texture2D(lightmap, lightmapUvPass);',
        'return lightmapColor.rgb;'
    ])
}

export {bake_lightmap, render_lightmap}