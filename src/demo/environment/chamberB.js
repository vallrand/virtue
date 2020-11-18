import {vec2, vec3, quat} from '../../modules/math'

const buildLadder = (name, position, quaternion) => [
    ...Array.range(4).map(idx => ({
        material: 'obstacleMaterial',
        cover: 'metal',
        mass: 0,
        position: [-8.4, idx * 4, idx % 2 ? 2 : -2],
        quaternion: quat.setAxisAngle(vec3.AXIS_Y, idx % 2 ? Math.PI : 0),
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,4,0],[0,0,4],[2,0,0],[2,4,0],[2,0,4]],
            faces: [[2,1,0],[4,5,3],[2,5,4,1],[3,5,2,0],[1,4,3,0]]
        }]
    })),
    ...Array.range(4).map(idx => ({
        material: 'obstacleMaterial',
        cover: 'metal',
        mass: 0,
        position: [-8.4, 2 + idx * 4, idx % 2 ? 3: -3],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 2, 1] }]
    })), {
        name: 'ladder-center',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-8.2, 9, 0],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.2, 9, 2] }]
    },
    {
        name: 'ladder-back-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-5.4, 12, 0],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1, 10, 4] }]
    }, 
    {
        name: 'ladder-bottom-part',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-9.2, 2, 1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.2, 2, 3] }]
    }
]

const buildWalls = () => [
    {
        name: 'floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [42, -10, 0],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [62, 10, 35] }]
    },
    ...[
        [14,7], [14,-7],
        [18,16], [18,-16],
        [30,5], [30,-5],
        [40,16], [40,-16],
        [62,16], [62,-16],
        [73,5], [73,-5]
    ].map(([ x, z ]) => ({
        mass: 0,
        material: 'obstacleMaterial',
        position: [x, 20, z],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [3.6, 20, 2] }]
    })),
    {
        name: 'upper-entrance-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-15, 8, 0],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [5, 8, 35] }]
    },
    {
        name: 'upper-left-wall-top',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-13.5, 20, 20],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [6.5, 4, 15] }]
    },
    {
        name: 'upper-right-wall-top',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-13.5, 20, -20],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [6.5, 4, 15] }]
    },
    {
        name: 'upper-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-8.4, 12, 19.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 12, 15.5] }]
    },
    {
        name: 'upper-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-8.4, 12, -19.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 12, 15.5] }]
    },
    {
        name: 'upper-entrance-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-17.2, 10, 4.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2.8, 10, 3.5] }]
    }, {
        name: 'upper-entrance-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-17.2, 10, -4.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2.8, 10, 3.5] }]
    },
    {
        name: 'left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [38, 14, 30],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [58, 14, 5] }]
    },
    {
        name: 'right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [38, 14, -30],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [58, 14, 5] }]
    },
    {
        name: 'lower-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [97.2, 14, 18],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [6.8, 14, 17] }]
    },
    {
        name: 'lower-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [97.2, 14, -18],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [6.8, 14, 17] }]
    },
    {
        name: 'lower-entrance-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [98, 0, 0],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [
                [0,0,-1],[3,2.8,-1],[6,2.8,-1],[6,0,-1],
                [0,0,1],[3,2.8,1],[6,2.8,1],[6,0,1]
            ],
            faces: [[7,6,5,4],[0,1,2,3], [4,5,1,0],[5,6,2,1],[4,0,3,7],[2,6,7,3]]
        }]
    },
    ...buildLadder()
]

export const chamberB = {
    visual: {
        className: 'instance',
        position: [0,0,0],
        rotation: [0,0,0,1],
        nodes: [
            { className: 'instance', group: 'static', url: 'assets/environment/chamber-b.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/scaffolding-b.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/pipes-b.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'light', type: 'spotlight', position: [16, 40, 0], destination: [16, 0, 0], color: [0.64,0.58,0.5], angle: 0.36 * Math.PI, radius: 36.0, castShadow: true },
            { className: 'light', type: 'spotlight', position: [54, 40, -24], destination: [54, 0, -24], color: [0.64,0.58,0.5], angle: 0.36 * Math.PI, radius: 36.0, castShadow: true },
            { className: 'light', type: 'spotlight', position: [54, 40, 24], destination: [54, 0, 24], color: [0.64,0.58,0.5], angle: 0.36 * Math.PI, radius: 36.0, castShadow: true },
            { className: 'light', type: 'spotlight', position: [80, 40, 0], destination: [80, 0, 0], color: [0.64,0.58,0.5], angle: 0.36 * Math.PI, radius: 36.0, castShadow: true },
            { className: 'light', type: 'omnilight', position: [48, 20, 0], color: [0.06,0.02,0.02], radius: 128.0, castShadow: false },
            
            { className: 'emitter', type: 'fog', timeOffset: 0, position: [40, 0, 0] },
            { className: 'audio', url: 'assets/sounds/noise.mp3', position: [40, 0, 0], volume: 8, loop: true, startTime: 0 },
            
            { className: 'instance', group: 'decal', url: 'assets/effects/wall-sign-a.png', position: [91,4,3], scale: vec3(3,3,3), rotation: quat.setAxisAngle(vec3.AXIS_Y, -0.5 * Math.PI)  },
            { className: 'instance', group: 'decal', url: 'assets/effects/wall-sign-b.png', position: [91,4,-3], scale: vec3(3,3,3), rotation: quat.setAxisAngle(vec3.AXIS_Y, -0.5 * Math.PI)  },
            { className: 'instance', group: 'decal', url: 'assets/effects/blood-a.png', position: [30,4,-22], scale: vec3(12,12,12), rotation: quat.setAxisAngle(vec3.AXIS_X, 0.36 * Math.PI) },
            { className: 'instance', group: 'decal', url: 'assets/effects/blood-b.png', position: [32,4,22], scale: vec3(12,12,12), rotation: quat.setAxisAngle(vec3.AXIS_X, -0.8 * Math.PI) }
        ]
    },
    behavior: [],
    imposter: [
        ...buildWalls()
    ],
    metaData: {
        connectors: [{
            position: [104-1,2.8,0],
            normal: [1,0,0]
        }, {
            position: [-20+1,16,0],
            normal: [-1,0,0]
        }],
        start: [50,10,0]
    }
}