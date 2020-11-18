export * from './vglsl'

import { fullscreen, fullscreen_cube } from './lib/fullscreen'
import {depth} from './lib/depth'
import {spotlight, omnilight, hemisphere} from './lib/lighting'
import {static_geometry} from './lib/static_geometry'
import {linear_skinning} from './lib/linear_skinning'
import {dualquat_skinning} from './lib/dualquat_skinning'
import {geometry} from './lib/geometry'

import {vsm_depth, vsm_depth_encoded, vsm_shadow, vsm_cube_shadow, vsm_shadow_encoded} from './lib/shadow_vsm'
import {box_blur} from './lib/blur'
import {dilate} from './lib/dilate'

import {bake_lightmap, render_lightmap} from './lib/light_mapping'

import {fog_exp} from './lib/fog'
import {blinn_phong} from './lib/blinn_phong'
import {cook_torrance} from './lib/cook_torrance'
import {normal_mapping} from './lib/normal_mapping'
import {ambient_light} from './lib/ambient_light'

export const shaders = {
    fullscreen,
    fullscreen_cube,
    depth,
    
    spotlight,
    omnilight,
    hemisphere,
    
    static_geometry,
    linear_skinning,
    dualquat_skinning,
    geometry,
    
    vsm_depth,
    vsm_depth_encoded,
    vsm_shadow,
    vsm_cube_shadow,
    vsm_shadow_encoded,
    
    box_blur,
    dilate,
    
    bake_lightmap,
    render_lightmap,
    
    fog_exp,
    blinn_phong,
    cook_torrance,
    normal_mapping,
    ambient_light
}