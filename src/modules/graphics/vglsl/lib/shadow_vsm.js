import {vglsl} from '../vglsl'

const vsm_depth = {
    vert: vglsl.createShader()
    .attribute('vec3', 'position')
    
    .uniform('mat4', 'viewMatrix')
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'modelMatrix')
    
    .varying('vec3', 'positionPass')
    
    .main([
        'vec4 viewPosition = viewMatrix * modelMatrix * vec4(position, 1.0);',
        'positionPass = viewPosition.xyz;',
        'gl_Position = projectionMatrix * viewPosition;'
    ]),
    frag: vglsl.createShader()
    .extension('GL_OES_standard_derivatives')
    
    .varying('vec3', 'positionPass')

    .uniform('float', 'radius')
    
    .main([
        //'float depth = projectionMatrix[3][2] / (projectionMatrix[2][2] + gl_FragCoord.z);',
        'float depth = length(positionPass);',
        'depth = clamp(depth / (2.0*radius), 0.0, 1.0);',
        'float dx = dFdx(depth);',
        'float dy = dFdy(depth);',
        'float moment1 = depth;',
        'float moment2 = depth*depth + 0.25*(dx*dx + dy*dy);',
        'gl_FragColor = vec4(moment1, moment2, 0.0, 1.0);'
    ])
}

const vsm_shadow = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    .uniform('sampler2D', 'shadowMap')
    .uniform('mat4', 'lightProjectionMatrix')
    
    .function('float linstep(float low, float high, float v)', ['return clamp((v-low)/(high-low), 0.0, 1.0);'])
    .function('float VSM(sampler2D depths, vec2 uv, float compare)', [
        'vec2 moments = texture2D(depths, uv).xy;',
        'float p = smoothstep(compare-0.02, compare, moments.x);',
        'float variance = max(moments.y - moments.x*moments.x, -0.001);',
        'float d = compare - moments.x;',
        'float p_max = linstep(0.2, 1.0, variance / (variance + d*d));',
        'return clamp(max(p, p_max), 0.0, 1.0);'
    ])
    
    .function('float calcShadow(void)', [ //TODO use lightDirectionPass?
        'float depth = clamp(length(lightViewPositionPass) / (light.radius * 2.0), 0.0, 1.0);',
        'vec4 shadowMapPosition = lightProjectionMatrix * vec4(lightViewPositionPass, 1.0);',
        'vec2 shadowMapUV = (shadowMapPosition.xy / shadowMapPosition.w) * 0.5 + 0.5;',
        'return VSM(shadowMap, shadowMapUV, depth);'
    ])
}

const vsm_cube_shadow = {
    vert: vglsl.createShader(),
    frag: vglsl.createShader()
    .uniform('samplerCube', 'shadowMap')
    
    .function('float linstep(float low, float high, float v)', ['return clamp((v-low)/(high-low), 0.0, 1.0);'])
    .function('float VSM(samplerCube depths, vec3 uv, float compare)', [
        'vec2 moments = textureCube(depths, uv).xy;',
        'float p = smoothstep(compare-0.02, compare, moments.x);',
        'float variance = max(moments.y - moments.x*moments.x, -0.001);',
        'float d = compare - moments.x;',
        'float p_max = linstep(0.2, 1.0, variance / (variance + d*d));',
        'return clamp(max(p, p_max), 0.0, 1.0);'
    ])
    
    .function('float calcShadow(void)', [
        'float depth = clamp(length(lightDirectionPass) / (light.radius * 2.0), 0.0, 1.0);',
        'return VSM(shadowMap, -lightDirectionPass, depth);'
    ])
}

const vsm_depth_encoded = {}
const vsm_shadow_encoded = {}

/*const encodedDepth = {
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
}*/

export {vsm_depth, vsm_depth_encoded, vsm_shadow, vsm_cube_shadow, vsm_shadow_encoded}