import {vglsl} from '../vglsl'

const spotlight = {
    vert: vglsl.createShader()
    .uniform('mat4', 'lightViewMatrix')
    
    .varying('vec3', 'lightDirectionPass')
    .varying('vec3', 'lightViewPositionPass')
    
    .function('vec3 extractLightPosition(mat4 lvm)', [ 'return -vec3(lvm[3]) * mat3(lvm);' ])
    
    .function('void setupLight(vec4 worldPosition)', [
        'lightDirectionPass = extractLightPosition(lightViewMatrix) - worldPosition.xyz;',
        'lightViewPositionPass = vec4(lightViewMatrix * worldPosition).xyz;'
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'lightDirectionPass')
    .varying('vec3', 'lightViewPositionPass')
    
    .struct('SpotLight', [
        'vec3 color',
        'vec3 direction',
        'float radius',
        'float outerAngle',
        'float innerAngle'
    ])
    
    .uniform('SpotLight', 'light')
    
    .function('float distanceAttenuation(float radius, float distance, float cutoff)', [
        'float denom = max(distance - radius, 0.0)/radius + 1.0;',
        'float attenuation = 1.0 / (denom*denom);',
        'return max((attenuation - cutoff) / (1.0 - cutoff), 0.0);'
    ])

    .function('float spotAttenuation(vec3 lightDirection)', [
        'float spotAngle = dot(-lightDirection, light.direction);',
        'return clamp((spotAngle - light.outerAngle) / (light.innerAngle - light.outerAngle), 0.0, 1.0);' 
    ])
    
    .function('float calcShadow(void)', ['return 1.0;'])
    
    .function('vec3 calcLight(vec3 normal, vec3 viewDirection)', [
        'vec3 lightDirection = normalize(lightDirectionPass);',
        'float lambert = max(dot(normal, lightDirection), 0.0);',
        'if(lambert < 0.0){ return vec3(0.0, 0.0, 0.0); }',
        'float distance = length(lightViewPositionPass);', //TODO optimise, by calculating distance once, and then normalizing direction vector
        
        'float distAtt = distanceAttenuation(light.radius, distance, 0.0001);',
        
        'float spotAtt = spotAttenuation(lightDirection);',
        
        'vec3 lightFactor = light.color * lambert * distAtt * spotAtt * 5.0;',
        'return lightFactor * calcShadow();'
    ])
}

//TODO rework for correct implementation
const omnilight = {
    vert: vglsl.createShader()
    .uniform('vec3', 'lightPosition')
    
    .varying('vec3', 'lightDirectionPass')
    
    .function('void setupLight(vec4 worldPosition)', [
        'lightDirectionPass = lightPosition - worldPosition.xyz;',
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'lightDirectionPass')
    
    .struct('OmniLight', [
        'vec3 color',
        'float radius'
    ])
    
    .uniform('OmniLight', 'light')
    
    .function('float distanceAttenuation(float radius, float distance, float cutoff)', [
        'float denom = max(distance - radius, 0.0)/radius + 1.0;',
        'float attenuation = 1.0 / (denom*denom);',
        'return max((attenuation - cutoff) / (1.0 - cutoff), 0.0);'
    ])
    
    .function('float calcShadow(void)', ['return 1.0;'])
    
    .function('vec3 calcLight(vec3 normal, vec3 viewDirection)', [
        'vec3 lightDirection = normalize(lightDirectionPass);',
        'float lambert = max(dot(normal, lightDirection), 0.0);',
        'if(lambert < 0.0){ return vec3(0.0, 0.0, 0.0); }',
        'float distance = length(lightDirectionPass);',
        'float distAtt = distanceAttenuation(light.radius, distance, 0.0001);',
        'vec3 lightFactor = light.color * lambert * distAtt * 5.0;',
        'return lightFactor * calcShadow();'
    ])
}

const hemisphere = {
    vert: vglsl.createShader()
    .function('void setupLight(vec4 worldPosition)', []),
    frag: vglsl.createShader()
    .struct('HemisphereLight', [
        'vec3 up',
        'vec3 skyColor',
        'vec3 groundColor'
    ])
    
    .uniform('HemisphereLight', 'light')
    
    .function('vec3 calcLight(vec3 normal, vec3 viewDirection)', [
        'float NdotL = dot(normal, light.up);',
        'float lightInfluence = NdotL * 0.5 + 0.5;',
        'return mix(light.groundColor, light.skyColor, lightInfluence);'
    ])
}

export {spotlight, omnilight, hemisphere}