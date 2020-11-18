import {vec2, vec3, quat} from '../../modules/math'

const buildWalls = () => [
    {
        name: 'floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-50, -17.8, -0.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [20, 6.2, 26.7] }]
    },
    {
        name: 'front-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-30+1, -14, -1.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1, 10, 27.7] }]
    },
    {
        name: 'corridor-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-58.5, -18.4, 59],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [11.5, 5.6, 32.4] }]
    },
    {
        name: 'corridor-upper-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-52, -11.3, 59],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [5, 1.5, 32.4] }]
    },
    {
        name: 'back-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-84, -12, 45],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [14, 12, 64] }]
    },
    {
        name: 'back-passage-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-87, -21, -26.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[17,9.4,0],[17,0,0],[0,0,7.8],[17,9.4,7.8],[17,0,7.8]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'back-passage-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-84, -22.5, -22.9],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [14, 1.5, 3.9] }]
    },
    {
        name: 'back-passage-door-right',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-96, -10.5, -20.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 10.5, 1.4] }]
    },
    {
        name: 'back-passage-door-left',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-96, -10.5, -25.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 10.5, 1.4] }]
    },
    {
        name: 'back-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-64, -12, -27.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [34, 12, 1] }]
    },
    {
        name: 'left-side',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-47.1, -12, -21.4],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [17.1, 12, 5.4] }]
    },
    {
        name: 'right-side',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-47.1, -12, 20.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [17.1, 12, 6] }]
    },
    {
        name: 'corridor-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-49, -4.9, 56.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 4.9, 29.9] }]
    },
    {
        name: 'corridor-wall-corner',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-49, -4.9, 90],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 4.9, 1.4] }]
    },
    {
        name: 'corridor-end',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-58.5, -12, 100.2],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [11.5, 12, 8.8] }]
    },
    {
        name: 'corridor-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-70, -12.8, 26.6+1],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,1.2,-1],[0,0,-1],[9.8,0,0],[9.8,1.2,-1],[9.8,0,-1]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'corridor-left-ramp',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-57-3.2, -12.8, 27.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[3.2,3,0],[3.2,0,0],[0,0,4.4],[3.2,3,4.4],[3.2,0,4.4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'corridor-right-ramp',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-57-3.2, -12.8, 86.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[3.2,3,0],[3.2,0,0],[0,0,4.8],[3.2,3,4.8],[3.2,0,4.8]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'corridor-divider',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-57.9, -6.4, 59.3],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.9, 6.4, 27.3] }]
    },
    {
        name: 'corridor-divider-part',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-58.6, -6.4, 27.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.6, 6.4, 0.5] }]
    }
]

export const chamberC = {
    visual: {
        className: 'instance',
        position: [0,0,0],
        rotation: [0,0,0,1],
        nodes: [
            { className: 'instance', group: 'static', url: 'assets/environment/chamber-c.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/scaffolding-c.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/pipes-c.vmf', position:[0,0,0], scale: vec3(1) },
            
            { className: 'liquid', position: [-2, -14, -2], scale: [0.4, 0.4, 0.4], color: [0,0.05,0.05] },
            { className: 'audio', url: 'assets/sounds/water.mp3', position: [-2, -14, -2], volume: 8, loop: true, startTime: 0 },
            
            { className: 'light', type: 'spotlight', position: [10,40,0], destination: [-20,-10,0], color: [0.4,0.5,0.56], angle: 0.42 * Math.PI, radius: 78, castShadow: true },
            { className: 'light', type: 'spotlight', position: [-90,4,-23], destination: [-90,-20,-23], color: [0.72,0.3,0.26], angle: 0.25 * Math.PI, radius: 64, castShadow: false },
            { className: 'light', type: 'spotlight', position: [-66, -2, 90], destination: [-54, -10, 30], color: [1,0.8,0.4], angle: 0.3 * Math.PI, radius: 36, castShadow: true },
            
            { className: 'light', type: 'spotlight', position: [-68, 0, 30], destination: [-60, -20, 34], color: [0.5,0.4,0.2], angle: 0.25 * Math.PI, radius: 24, castShadow: false },
            { className: 'light', type: 'spotlight', position: [-68, 0, 90], destination: [-60, -20, 90], color: [0.5,0.4,0.2], angle: 0.25 * Math.PI, radius: 24, castShadow: false },
            
            { className: 'light', type: 'omnilight', position: [-60, 0, -5], color: [0.2,0.18,0.1], radius: 24, castShadow: true },
            
            { className: 'instance', group: 'decal', url: 'assets/effects/blood-a.png', position: [-60, -11, 74], scale: vec3(8,8,8), rotation: quat.fromEulerOrdered(-0.5 * Math.PI, -0.42 * Math.PI, 0) }
        ]
    },
    behavior: [],
    imposter: [
        ...buildWalls()
    ],
    metaData: {
        connectors: [{
            position: [-98+1+1,-21,-22.9],
            normal: [-1,0,0]
        }, {
            position: [-47-1,-9.8,87.5],
            normal: [1,0,0]
        }],
        start: [-33, -5, 5]
    }
}