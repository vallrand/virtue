import {vec2, vec3, quat} from '../../modules/math'

const buildWalls = () => [
    {
        name: 'floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-146.1, -5, -186.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [20.7, 5, 63.6] }]
    },
    {
        name: 'floor-ladder',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-171.5, -5, -186.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4.7, 5, 63.6] }]
    },
    {
        name: 'ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-166.8, 0, -200.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,14.8,-22.4],[0,0,-22.4],[8.6,0,0],[8.6,14.8,-22.4],[8.6,0,-22.4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'room-center-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-142.1, 10, -211.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [16.7, 10, 11.2] }]
    },
    {
        name: 'room-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-171.5, 10, -222.3],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4.7, 10, 27.7] }]
    },
    {
        name: 'room-upper-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-150.8, 7.4, -236.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [25.4, 7.4, 13.6] }]
    },
    {
        name: 'room-upper-back-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-155.6, 17.4, -241.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [20.6, 2.6, 8.5] }]
    },
    {
        name: 'platform-inner-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-167.9, 10, -159.9],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4.3, 10, 24.9] }]
    },                    
    {
        name: 'upper-entrance-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-133.1, 17.4, -248.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.9, 2.6, 1.5] }]
    },
    {
        name: 'upper-entrance-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-127.3, 17.4, -248.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.9, 2.6, 1.5] }]
    },
    {
        name: 'central-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-144.5, 10, -159.9],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [19.1, 10, 24.9] }]
    },
    {
        name: 'right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-123.4, 5, -186.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 15, 63.6] }]
    },
    {
        name: 'left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-178.2, 5, -185.2],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 15, 64.8] }]
    },
    {
        name: 'front-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-150.8, 5, -118.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [29.4, 15, 2] }]
    },
    {
        name: 'front-left-corner',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-166.6, 10, -124.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [9.6, 10, 3.7] }]
    },
    {
        name: 'front-left-corner-part',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-169.9, 10, -129.2],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [6.3, 10, 1.4] }]
    },
    {
        name: 'front-right-corner',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-138.2, 10, -126.7],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [12.8, 10, 3.9] }]
    },
    {
        name: 'front-right-corner-part',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-132.1, 10, -132.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [6.7, 10, 2.2] }]
    },
    {
        name: 'passage-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-148.8, -7.5, -121.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [27.4, 2.5, 1.2] }]
    },
    {
        name: 'passage-upper-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-163.6, -2.5, -121.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [12.6, 2.5, 1.2] }]
    },
    {
        name: 'front-platform-ladder',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-151, -5, -122.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,5,0],[12,0,0],[0,0,2.4],[0,5,2.4],[12,0,2.4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    }
]

export const chamberD = {
    visual: {
        className: 'instance',
        position: [0,0,0],
        rotation: [0,0,0,1],
        nodes: [
            { className: 'instance', group: 'static', url: 'assets/environment/chamber-d.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/scaffolding-d.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/pipes-d.vmf', position:[0,0,0], scale: vec3(1) },
            
            { className: 'liquid', position: [-200, -10, -160], scale: [0.4,0.4,2], color: [0,0.1,0] },
            
            { className: 'audio', url: 'assets/sounds/water.mp3', position: [-200, -10, -160], volume: 8, loop: true, startTime: 0 },
            
            { className: 'audio', url: 'assets/sounds/noise.mp3', position: [-150, 4, -128], volume: 8, loop: true, startTime: 0 },
            
            { className: 'light', type: 'spotlight', position: [-128, 25, -188], destination: [-128, 0, -230], color: [0.5,0.44,0.3], angle: 0.36 * Math.PI, radius: 48, castShadow: true },
            { className: 'light', type: 'spotlight', position: [-144, 25, -188], destination: [-144, 0, -230], color: [0.5,0.44,0.3], angle: 0.36 * Math.PI, radius: 48, castShadow: true },
            { className: 'light', type: 'omnilight', position: [-143, 20, -213], color: [0.16,0.14,0.1], radius: 48.0, castShadow: false },
            
            { className: 'light', type: 'spotlight', position: [-200, 20, -190], destination: [-160, -10, -180], color: [0.4,0.6,0.6], angle: 0.25 * Math.PI, radius: 128, castShadow: true },
            { className: 'light', type: 'spotlight', position: [-200, 20, -132], destination: [-160, -10, -120], color: [0.4,0.6,0.6], angle: 0.25 * Math.PI, radius: 128, castShadow: true },
            { className: 'light', type: 'omnilight', position: [-180, 0, -160], color: [0.2,0.3,0.3], radius: 28.0, castShadow: false },
            
            { className: 'light', type: 'spotlight', position: [-158, 12, -128], destination: [-155, 0, -134.5], color: [0.6,0.6,0.4], angle: 0.3 * Math.PI, radius: 48, castShadow: true },
            
            { className: 'light', type: 'omnilight', position: [-153, 8, -120], color: [0.2,0.18,0.1], radius: 32.0, castShadow: false },
            
            
            { className: 'instance', group: 'decal', url: 'assets/effects/wall-sign-a.png', position: [-150, 4, -128], scale: vec3(4,4,4), rotation: quat.setAxisAngle(vec3.AXIS_Y, -0.5 * Math.PI)  },
            
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] },
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] },
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] }
        ]
    },
    behavior: [],
    imposter: [
        ...buildWalls(),
        ...[
            [-131, 3, -195],
            [-131.5, 6, -194.5],
            [-136, 3, -191]
        ].map(position => ({
            name: 'box',
            mass: 1,
            material: 'defaultContactMaterial',
            position: position,
            quaternion: [0, 0, 0, 1],
            shapes: [{ type: 'box', halfExtents: [2, 2, 2] }]
        }))
    ],
    metaData: {
        connectors: [{
            position: [-121-1.4,-5,-121.6],
            normal: [1,0,0]
        }, {
            position: [-130.2,14.8,-250+1],
            normal: [0,0,-1]
        }],
        start: [-174, 2, -160]
    }
}