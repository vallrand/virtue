import {factory, Signal, tie} from '../../util'
import {shaders, vglsl} from '../vglsl'
import {vec2, vec3, vec4, quat, mat3, mat4} from '../../math'
import { GridGeometry } from '../../geometry'

const liquid = {
    vert: vglsl.createShader()
    .attribute('vec2', 'uv')
    
    .uniform('mat4', 'projectionMatrix')
    .uniform('mat4', 'viewMatrix')
    .uniform('mat4', 'invModelMatrix')
    .uniform('vec3', 'center')
    
    .varying('vec2', 'uvPass')
    .varying('vec3', 'worldPositionPass')
    .varying('vec3', 'cameraEyePass')
    .varying('vec2', 'normalizedPass')
    
    .const('float', 'infinite', '150000.0')
    .const('vec3', 'groundNormal', 'vec3(0.0,-1.0,0.0)')
    
    .function('vec3 interceptPlane(in vec3 source, in vec3 dir, in vec3 normal, float height)', [
        // Compute the distance between the source and the surface, following a ray, then return the intersection
        // http://www.cs.rpi.edu/~cutler/classes/advancedgraphics/S09/lectures/11_ray_tracing.pdf
		'float distance = (-height - dot(normal, source)) / dot(normal, dir);',
		'if(distance < 0.0) return source + dir * distance;',
		'else return -(vec3(source.x, height, source.z) + vec3(dir.x, height, dir.z) * infinite);'
        //'else return -(vec3(source.x, height, source.z) + vec3(dir.x, 0.0, dir.z) * infinite);'
    ])
    .function('mat3 getRotation()', [
		'return mat3(viewMatrix[0].xyz,viewMatrix[1].xyz,viewMatrix[2].xyz);'
    ])
    .function('vec3 getCameraPosition(in mat3 rotation)', [
			// Xc = R * Xw + t
			// c = - R.t() * t <=> c = - t.t() * R
		'return - viewMatrix[3].xyz * rotation;'
    ])
    .function('vec2 getImagePlan()', [
			// Extracting aspect and focal from projection matrix:
			// P = | e   0       0   0 |
			//     | 0   e/(h/w) 0   0 |
			//     | 0   0       .   . |
			//     | 0   0       -1  0 |
		'float focal = projectionMatrix[0].x;',
		'float aspect = projectionMatrix[1].y;',
		'return vec2((uv.x - 0.5) * aspect, (uv.y - 0.5) * focal);'
    ])
    .function('vec3 getCamRay(in mat3 rotation, in vec2 screenUV)', [
        // Compute camera ray then rotate it in order to get it in world coordinate
		'return vec3(screenUV.x, screenUV.y, projectionMatrix[0].x) * rotation;'
    ])
    
    .function('vec3 computeProjectedPosition(in float groundHeight)', [
        'mat3 cameraRotation = getRotation();',
        'vec3 camPosition = getCameraPosition(cameraRotation);',
        
        'cameraEyePass = camPosition;',
        
//        '	if( camPosition.y < groundHeight )',
//		'		return vec3( 0.0, 0.0, 0.0 );',
        
        'vec2 screenUV = getImagePlan();',
        'vec3 ray = getCamRay(cameraRotation, screenUV);',
        'vec3 finalPos = interceptPlane(camPosition, ray, groundNormal, groundHeight);',
        
        //'float distance = length(finalPos);',
		//'if(distance > infinite) finalPos *= -infinite / distance;',
		
		'return finalPos;'
    ])
    
    .main([
        'uvPass = uv;',
        'float groundHeight = center.y;',
        'vec3 worldPosition = computeProjectedPosition(groundHeight);',
        
        'normalizedPass = (invModelMatrix * vec4(worldPosition, 1.0)).xz;',
        
        'worldPositionPass = worldPosition;',
        'gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);'
    ]),
    frag: vglsl.createShader()
    .varying('vec2', 'uvPass')
    
    .varying('vec3', 'worldPositionPass')
    .varying('vec3', 'cameraEyePass')
    .varying('vec2', 'normalizedPass')
    
    .uniform('float', 'time')
    
    .uniform('float', 'height')
    .uniform('float', 'choppiness')
    .uniform('float', 'frequency')
    .uniform('vec3', 'surfaceColor')
    
    .const('float', 'PI', Math.PI)
    .const('float', 'EPSILON', 1e-3)

    .const('int', 'ITERATIONS', 3)
    .const('mat2', 'octave_m', 'mat2(1.6,1.2,-1.2,1.6)')

    .function('float hash(vec2 p)', [
        'float h = dot(p,vec2(127.1,311.7));',
        'return fract(sin(h)*43758.5453123);'
    ])
    .function('float noise( in vec2 p )', [
        'vec2 i = floor( p );',
        'vec2 f = fract( p );	',
        'vec2 u = f*f*(3.0-2.0*f);',
        'return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), ',
        '                 hash( i + vec2(1.0,0.0) ), u.x),',
        '            mix( hash( i + vec2(0.0,1.0) ), ',
        '                 hash( i + vec2(1.0,1.0) ), u.x), u.y);',
    ])
    .function('float diffuse(vec3 n,vec3 l,float p)', [
        'return pow(dot(n,l) * 0.4 + 0.6,p);'
    ])
    .function('float specular(vec3 n,vec3 l,vec3 e,float s)', [
        'float nrm = (s + 8.0) / (PI * 8.0);',
    'return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;'
    ])
    .function('vec3 getSkyColor(vec3 e)', [
        'e.y = max(e.y,0.0);',
    'return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4);'
    ])
    .function('float sea_octave(vec2 uv, float choppy)', [
         'uv += noise(uv);',    
    'vec2 wv = 1.0-abs(sin(uv));',
    'vec2 swv = abs(cos(uv));',
    'wv = mix(wv,swv,wv);',
    'return pow(1.0-pow(wv.x * wv.y,0.65),choppy);',
    ])
    .function('float map_detailed(vec3 p)', [
    'float freq = frequency;',
    'float amp = height;',
    'float choppy = choppiness;',
    'vec2 uv = p.xz; uv.x *= 0.75;',
    
    'float d, h = 0.0;',
    'for(int i = 0; i < ITERATIONS; i++){  ',      
    	'd = sea_octave((uv+time)*freq,choppy);',
    	'd += sea_octave((uv-time)*freq,choppy);',
        'h += d * amp;',
    	'uv *= octave_m; freq *= 1.9; amp *= 0.22;',
        'choppy = mix(choppy,1.0,0.2);',
    '}',
    'return p.y - h;',
        
    ])
    .function('vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist)', [
        
        'float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);',
        'fresnel = pow(fresnel,3.0) * 0.65;',

        'vec3 reflected = getSkyColor(reflect(eye,n));',
        'vec3 refracted = surfaceColor + diffuse(n,l,80.0) * surfaceColor * 0.12;',

        'vec3 color = mix(refracted,reflected,fresnel);',

        'float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);',
        'color += surfaceColor * (p.y - height) * 0.18 * atten;',

        'color += vec3(specular(n,l,eye,60.0));',

        'return color;',
    ])
    .function('vec3 getNormal(vec3 p, float eps)', [
        'vec3 n;',
        'n.y = map_detailed(p);',
        'n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;',
        'n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;',
        'n.y = eps;',
        'return normalize(n);',
    ])
    
    .main([
	'vec2 uv = uvPass;',
        
    'vec3 dir = normalize(vec3(1.0,-1.0,1.0));',
    'vec3 ori = cameraEyePass;',
        
        
    'vec3 p = vec3(worldPositionPass.x, 0.0, worldPositionPass.z);',
    'vec3 dist = p - ori;',
        
    'vec3 n = getNormal(p, dot(dist,dist) * EPSILON * 0.1);',
    'vec3 light = normalize(vec3(0.0,1.0,0.8)); ',
    'vec3 color = getSeaColor(p,n,light,dir,dist);',
    
    'float opacity = min(1.0, 0.5 + (color.r + color.g + color.b) / 3.0);',
        
        
    'float fade = step(0.0, 1.0 - 0.01 * abs(normalizedPass.x)) * step(0.0, 1.0 - 0.01 * abs(normalizedPass.y));',
    'opacity *= fade;',
        
    'gl_FragColor = vec4(applyFog(pow(color,vec3(0.75))), opacity);'
    ])
}

function createGridMesh(){
    const geometry = GridGeometry({ columns: 64, rows: 64, width: 1, height: 1 })
    const vertices = Array.range(geometry.vertices.length).map(index => [...geometry.uvs[index]]).flatten()
    const indices = geometry.indices
    
    return {
        vertexArray: new Float32Array(vertices),
        indexArray: new Uint16Array(indices),
        dataFormat: [{ type: 'uv', size: 2, byteSize: 4 }]
    }
}

export const LiquidSurfacePass = (ctx, scene, lightmapping = true) => {
    const gl = ctx.gl,
          shader = ctx.compileShader(vglsl.merge(liquid, shaders.fog_exp))
    
    const meshData = createGridMesh()
    const vbo = factory.build('vbo', { ctx }).staticUpload(
        meshData.vertexArray,
        meshData.indexArray
    )
    const vao = factory.build('vao', { ctx }).setup(vbo, meshData.dataFormat)
    
    scene.camera.mutation.pipe(mutations => {
        if(mutations.projectionMatrix) shader.uao.projectionMatrix = mat4.copy(mutations.projectionMatrix, shader.uao.projectionMatrix)
        if(mutations.viewMatrix) shader.uao.viewMatrix = mat4.copy(mutations.viewMatrix, shader.uao.viewMatrix)
    }, false)
    
    scene.environment.mutation.pipe(mutations => {
        if(mutations.fogColor) shader.uao.fogColor = vec3.copy(mutations.fogColor, shader.uao.fogColor)
        if(mutations.fogDensity) shader.uao.fogDensity = mutations.fogDensity
    })
    
    return (ctx, scene, next, frame) => {
        ctx.culling = false
        ctx.depthTest = true
        ctx.depthMask = false
        ctx.blendMode = 'blend'
        
        const surfaces = scene.surfaces
        for(let i = surfaces.length - 1; i >= 0; i--){
            const surface = surfaces[i]
            
            if(surface.frameFlag !== frame){
                surface.frameFlag = frame
                surface.visible = scene.camera.frustumCulling(surface)
            }
            if(!surface.visible) continue
            
            vao.bind()
            shader.use()
            
            shader.uao.center = vec4.transform(vec3.ZERO, surface.modelMatrix, shader.uao.center)
            shader.uao.invModelMatrix = mat4.invert(surface.modelMatrix, shader.uao.invModelMatrix)
            
            shader.uao.time = surface.time
            
            shader.uao.height = surface.height
            shader.uao.choppiness = surface.choppiness
            shader.uao.frequency = surface.frequency
            shader.uao.surfaceColor = vec3.copy(surface.color, shader.uao.surfaceColor)
                        
            shader.uao.update()
            ctx.drawElements(meshData.indexArray.length, 0)
        }
        
        next()
    }
}