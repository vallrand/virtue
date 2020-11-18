import {vglsl} from '../vglsl'

const blinn_phong = {
    vert: vglsl.createShader()
    .function('void setupLight(void)', []),
    frag: vglsl.createShader()
    
    .function('float lambertian(vec3 normal, vec3 lightDirection)', [
        'return max(dot(normal, lightDirection), 0.0);'
    ])
    
    .const('float','glossiness','16.0')
    .function('float blinnPhong(vec3 normal, vec3 lightDirection, vec3 viewDirection)', [
        'vec3 halfVec = normalize(viewDirection + lightDirection);',
        'return pow(max(dot(normal, halfVec), 0.0), glossiness);'
    ])
    
    
}

export {blinn_phong}