import * as util from './modules/util'
import * as math from './modules/math'
import * as geometry from './modules/geometry'
import * as events from './modules/events'
import * as device from './modules/device'
import * as resources from './modules/resources'
import * as graphics from './modules/graphics'
import * as audio from './modules/audio'
import * as behavior from './modules/behavior'
import * as physics from './modules/physics'
import * as scene from './modules/scene'
import * as animation from './modules/animation'
import * as interaction from './modules/interaction'
import * as framework from './modules/framework'

import './modules/debug'

window.V = {
    util,
    math,
    geometry,
    events,
    device,
    resources,
    graphics,
    audio,
    animation,
    behavior,
    physics,
    scene,
    interaction,
    framework,
    
    init: options => util.onReady().pipe(_ => util.factory.build('application', options))
}

import main from './main'
main()