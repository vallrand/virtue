import {vglsl} from '../vglsl'

const ambient_light = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    .struct('dirLight', [
        'vec3 direction',
        'vec3 color'
    ])
    .uniform('vec3', 'ambient')
    .uniform('dirLight', 'sun')
    
    .function('vec3 calcLighting(vec3 normal, vec3 viewDirection)', [
        'vec3 lightDir = normalize(sun.direction);',
        'float diffuse = lambertian(normal, lightDir);',
        'float specular = 0.0;',
        //'if(diffuse > 0.0){specular = blinnPhong(normal, lightDir, viewDirection);}',
        //'return ambient + diffuse * sun.color + specular * vec3(1.0,1.0,1.0);'
        'return ambient + diffuse * sun.color;'
    ])
    
    
}

export {ambient_light}