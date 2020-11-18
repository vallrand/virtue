import {vglsl} from '../vglsl'

const cook_torrance = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    .const('float', 'PI', '3.141592653589793')
    .const('float', 'EPSILON', '0.000001')
    
   .function('float beckmannDistribution(float x, float roughness)', [
        'float NdotH = max(x, 0.0001);',
        'float cos2Alpha = NdotH * NdotH;',
        'float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;',
        'float roughness2 = roughness*roughness;',
        'float denom = PI * roughness2 * cos2Alpha * cos2Alpha;',
        'return exp(tan2Alpha / roughness2) / denom;'
    ])
    .function('float cookTorrance(vec3 normal, vec3 lightDirection, vec3 viewDirection)', [
        'float fresnel = 0.0;',
        'float roughness = 0.1;',//[0-1]
        'float VdotN = max(dot(viewDirection, normal), 0.0);',
        'float LdotN = max(dot(lightDirection, normal), EPSILON);',
        'vec3 halfAngle = normalize(lightDirection + viewDirection);',
        'float NdotH = max(dot(normal, halfAngle), 0.0);',
        'float VdotH = max(dot(viewDirection, halfAngle), 0.0);',
        'float x = 2.0 * NdotH / VdotH;',
        'float G = min(1.0, min(x * VdotN, x * LdotN));',
        'float D = beckmannDistribution(NdotH, roughness);',
        'float F = pow(1.0 - VdotN, fresnel);',
        'float power = G * F * D / max(PI * VdotN * LdotN, EPSILON);',
        'return power;'
    ])
    
    
}

export {cook_torrance}