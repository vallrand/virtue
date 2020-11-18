import {vec2, vec3, quat} from '../../modules/math'

const buildWalls = () => [
    {
        name: 'floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5, -2, -134],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [28.7, 4, 60] }]
    },
    {
        name: 'left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-68.2, 14, -134],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 12, 60] }]
    },
    {
        name: 'right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-14.8, 14, -134],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 12, 60] }]
    },
    {
        name: 'platform-floor',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5, 8.2, -173.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2.7, 6.2, 20.5] }]
    },
    {
        name: 'platform-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-57.2, 14, -178.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13, 12, 15.4] }]
    },
    {
        name: 'platform-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-25.8, 14, -178.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13, 12, 15.4] }]
    },
    {
        name: 'entrance-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-39.7, 20.2, -191.7],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.9, 5.8, 2.3] }]
    },
    {
        name: 'entrance-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-43.3, 20.2, -191.7],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.9, 5.8, 2.3] }]
    },
    {
        name: 'front-ramp-corners',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5, 5.3, -160.3],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [28.7, 3.3, 2.9] }]
    },
    {
        name: 'back-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-56.3, 2 + 12, -76.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13.9, 12, 2.8] }]
    },
    {
        name: 'back-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-26.7, 2 + 12, -76.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13.9, 12, 2.8] }]
    },
    {
        name: 'back-center-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5, 17.3, -76.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.9, 8.7, 2.8] }]
    },
    {
        name: 'back-ramp-left-corner',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-56.3, 5.3, -83.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13.9, 3.3, 3.5] }]
    },
    {
        name: 'back-ramp-right-corner',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-26.7, 5.3, -83.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13.9, 3.3, 3.5] }]
    },
    {
        name: 'back-ramp-center',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5, 11.5, -83.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2.7, 2.9, 3.5] }]
    },                   
    {
        name: 'front-lower-left-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-66.2, 2, -144.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,6.6,-12.6],[0,0,-12.6],[6.2,0,0],[6.2,6.6,-12.6],[6.2,0,-12.6]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'front-lower-right-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-23, 2, -144.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,6.6,-12.6],[0,0,-12.6],[6.2,0,0],[6.2,6.6,-12.6],[6.2,0,-12.6]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'back-lower-left-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-66.2, 2, -86.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,6.6,0],[0,0,-12.6],[6.2,0,0],[6.2,6.6,0],[6.2,0,-12.6]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'back-lower-right-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-23, 2, -86.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,6.6,0],[0,0,-12.6],[6.2,0,0],[6.2,6.6,0],[6.2,0,-12.6]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'back-upper-left-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-60, 8.6, -86.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[15.8,5.8,0],[15.8,0,0],[0,0,7],[15.8,5.8,7],[15.8,0,7]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'back-upper-right-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-38.8, 8.6, -86.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,5.8,0],[15.8,0,0],[0,0,7],[0,5.8,7],[15.8,0,7]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'front-upper-left-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-60, 8.6, -163.2],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[15.8,5.8,0],[15.8,0,0],[0,0,5.8],[15.8,5.8,5.8],[15.8,0,5.8]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'front-upper-right-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-38.8, 8.6, -163.2],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,5.8,0],[15.8,0,0],[0,0,5.8],[0,5.8,5.8],[15.8,0,5.8]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'front-platform-ladder',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5-1.3, 14.4, -153],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,3.8,0],[0,0,-4],[2*1.3,0,0],[2*1.3,3.8,0],[2*1.3,0,-4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'back-platform-ladder',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5-1.3, 14.4, -86.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,3.8,-4],[0,0,-4],[2*1.3,0,0],[2*1.3,3.8,-4],[2*1.3,0,-4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'platform-bridge',
        cover: 'metal',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.5, 16.3, -121.8],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.3, 1.9, 31.2] }]
    },
    {
        name: 'platform-bridge-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-43.5, 14.4+4, -122],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.7, 4, 35.4] }]
    },
    {
        name: 'platform-bridge-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-39.5, 14.4+4, -122],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.7, 4, 35.4] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-25.4, 22, -123],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [3, 20, 5.4] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-57.8, 22, -123],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [3, 20, 5.4] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-56, 22, -151.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 20, 6.3] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-27.2, 22, -151.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 20, 6.3] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-56, 22, -86.6-6.3],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 20, 6.3] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-27.2, 22, -86.6-6.3],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 20, 6.3] }]
    },
    {
        mass: 0,
        material: 'obstacleMaterial',
        position: [-41.6, 2+6.2, -123],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [13.2, 6.2, 12+4.6] }]
    }
]

export const chamberE = {
    visual: {
        className: 'instance',
        position: [0,0,0],
        rotation: [0,0,0,1],
        nodes: [
            { className: 'instance', group: 'static', url: 'assets/environment/chamber-e.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/scaffolding-e.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'light', type: 'omnilight', position: [-42, -5, -123], color: [0.2,0.1,0.1], radius: 24.0, castShadow: false },
            
            { className: 'liquid', position: [-40,0,-140], scale: [0.4,0.4,0.6], color: [0.3,0,0] },
            
            { className: 'audio', url: 'assets/sounds/water.mp3', position: [-42, -4, 123], volume: 20, loop: true, startTime: 0 },
            
            { className: 'light', type: 'spotlight', position: [-42, 32, -135], destination: [-42, 0, -135], color: [0.6,0.4,0.3], angle: 0.36 * Math.PI, radius: 48, castShadow: true },
            { className: 'light', type: 'spotlight', position: [-42, 32, -110], destination: [-42, 0, -110], color: [0.6,0.4,0.3], angle: 0.36 * Math.PI, radius: 48, castShadow: true },
            
            { className: 'light', type: 'spotlight', position: [-42, 24, -186], destination: [-42, 10, -158], color: [0.6,0.4,0.4], angle: 0.2 * Math.PI, radius: 48, castShadow: true },
            { className: 'light', type: 'omnilight', position: [-42, 0, -178], color: [0.2,0.1,0.1], radius: 32.0, castShadow: false },
        ]
    },
    behavior: [],
    imposter: [
        ...buildWalls()
    ],
    metaData: {
        connectors: [{
            position: [-41.5,14.4,-194+1],
            normal: [0,0,-1]
        }, {
            position: [-41.5,2,-74-1],
            normal: [0,0,1]
        }],
        start: [-24, 5, -134]
    }
}