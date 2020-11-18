import {vglsl} from '../vglsl'

const static_geometry = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    .attribute('vec3', 'normal')
    .attribute('vec2', 'uv')
    .uniform('mat4', 'Pmat')
    .uniform('mat4', 'MVmat')
    .varying('vec3', 'vNormal')
    .varying('vec2', 'vTexCoords')
    .varying('vec3', 'vViewDir')
    
    /*.function('', [
        'vec3 normal = normalize(normalMatrix, normal);',
        'vec3 tangent = normalize(normalMatrix, tangent.xyz);',
        'vec3 binormal = cross(normalMatrix)'
    ])*/
    .main([
        //::::ALTERNATIVE::::
        //'mat3 Nmat = mat3(MVmat[0][0],MVmat[1][0],MVmat[2][0],MVmat[0][1],MVmat[1][1],MVmat[2][1],MVmat[0][2],MVmat[1][2],MVmat[2][2]);'
        //'vNormal = normalize(normal * Nmat);'
        'mat3 Nmat = mat3(MVmat[0][0],MVmat[0][1],MVmat[0][2],MVmat[1][0],MVmat[1][1],MVmat[1][2],MVmat[2][0],MVmat[2][1],MVmat[2][2]);',
        'vec4 viewPosition = MVmat * vec4(position, 1.0);',
        'gl_Position = Pmat * viewPosition;',
        'vNormal = normalize(Nmat * normal);',
        'vViewDir = normalize(-viewPosition.xyz);',
        'vTexCoords = uv;',
        'setupLight();'
    ]),
    frag: vglsl.createShader()
    .varying('vec3', 'vNormal')
    .varying('vec2', 'vTexCoords')
    .varying('vec3', 'vViewDir')
    .uniform('sampler2D', 'albedo')

    .main([
        'vec4 color = texture2D(albedo, vTexCoords);',

        'if(color.a <= 0.1) discard;',
        
        'vec3 normal = normalize(vNormal);',
        'vec3 viewDirection = normalize(vViewDir);',
        //'normal = pertubNormal(normal, viewDirection, vTexCoords);',
        'vec3 totalLight = calcLighting(normal, viewDirection);',
        'gl_FragColor = vec4(applyFog(totalLight * color.rgb), color.a);'
        //,'gl_FragColor = vec4(totalLight * 0.8, 1.0);'
    ])
}

export {static_geometry}