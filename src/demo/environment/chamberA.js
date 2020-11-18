import {vec2, vec3, quat} from '../../modules/math'

const buildLadder = (name, position, quaternion) => [
    ...Array.range(8).map(idx => ({
        material: 'obstacleMaterial',
        cover: 'metal',
        mass: 0,
        position: [54.4, -32.6 + idx * 4, idx % 2 ? -113 : -117],
        quaternion: quat.setAxisAngle(vec3.AXIS_Y, idx % 2 ? Math.PI : 0),
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,4,0],[0,0,4],[2,0,0],[2,4,0],[2,0,4]],
            faces: [[2,1,0],[4,5,3],[2,5,4,1],[3,5,2,0],[1,4,3,0]]
        }]
    })),
    ...Array.range(8).map(idx => ({
        material: 'obstacleMaterial',
        cover: 'metal',
        mass: 0,
        position: [54.4, -30.8 + idx * 4 + 0.2, idx % 2 ? -112: -118],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [2, 2, 1] }]
    })), {
        name: 'ladder-center',
        mass: 0,
        material: 'obstacleMaterial',
        position: [54.6, -14.6, -115],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [0.2, 18, 2] }]
    } ,{
        name: 'ladder-front-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [57.4, -14.6, -115],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1, 18, 4] }]
    }, {
        name: 'ladder-back-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [51.6, -14.6, -115],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.2, 14, 4] }]
    }, {
        name: 'ladder-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [54.4, -14.6, -120],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 18, 1] }]
    }, {
        name: 'ladder-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [54.4, -14.6, -110],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 18, 1] }]
    }
]

const buildWalls = () => [
    {
        name: 'lower-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [74, -42.6, -114],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [40, 10, 40] }]
    },
    {
        name: 'upper-entrance-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [16.2, -5.6, -114],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [34.2, 5, 40] }]
    }, {
        name: 'upper-entrance-ledge',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-14, 0.7, -114],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [4, 1.3, 8] }]
    }, {
        name: 'upper-entrance-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-16.2, 5.4, -114 + 4.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.8, 6, 3.5] }]
    }, {
        name: 'upper-entrance-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-16.2, 5.4, -114 - 4.5],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1.8, 6, 3.5] }]
    }, {
        name: 'upper-entrance-right-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-10, -0.6, -114 - 8],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,2.6,0],[4,0,0],[0,0,4],[0,2.6,4],[4,0,4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    }, {
        name: 'upper-entrance-left-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-10, -0.6, -114 + 8 - 4],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[0,2.6,0],[4,0,0],[0,0,4],[0,2.6,4],[4,0,4]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    }, {
        name: 'upper-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [10, 5.4, -90],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [28, 6, 16] }]
    }, {
        name: 'upper-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [10, 5.4, -138],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [28, 6, 16] }]
    }, 
    ...Array.range(8).map((idx, index, array) => {
        const center = [74, 3.4, -114]
        const distance = 38
        let angle = Math.PI + 2 * Math.PI * idx / array.length
        let direction = vec2.direction(angle, distance)

        center[0] += direction[0]
        center[2] += direction[1]

        const edge = 2 * (distance+2) * Math.tan(Math.PI / array.length)
        
        return {
            material: 'obstacleMaterial',
            mass: 0,
            position: center,
            quaternion: quat.setAxisAngle(vec3.AXIS_Y, -angle),
            shapes: [{ type: 'box', halfExtents: [2, 36, 0.5 * edge] }]
        }
    }).slice(1),
    ...Array.range(8).map((idx, index, array) => {
        const center = [74, -5.6, -114]
        const distance = 30
        let angle = Math.PI + 2 * Math.PI * idx / array.length
        let direction = vec2.direction(angle, distance)

        center[0] += direction[0]
        center[2] += direction[1]
        
        const edge = 2 * (distance+8) * Math.tan(Math.PI / array.length)

        return {
            material: 'obstacleMaterial',
            cover: 'concrete',
            mass: 0,
            position: center,
            quaternion: quat.setAxisAngle(vec3.AXIS_Y, -angle),
            shapes: [{ type: 'box', halfExtents: [8, 5, 0.5 * edge] }]
        }
    }).slice(1),
    ...buildLadder(),                    
    {
        name: 'lower-entrance-floor',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [16,-46.6,-114.1],
        quaternion: [0,0,0,1],
        shapes: [{ type: 'box', halfExtents: [18, 6, 3.9] }]
    },          
    {
        name: 'lower-entrance-ramp',
        cover: 'concrete',
        mass: 0,
        material: 'obstacleMaterial',
        position: [0, -40.6, -118],
        quaternion: [0, 0, 0, 1],
        shapes: [{
            type: 'convex',
            vertices: [[0,0,0],[34,8,0],[34,0,0],[0,0,7.8],[34,8,7.8],[34,0,7.8]],
            faces: [[0,1,2],[3,5,4],[1,4,5,2],[0,2,5,3],[0,3,4,1]]
        }]
    },
    {
        name: 'lower-entrance-left-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-1, -26.3, -111.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1, 15.7, 1.4] }]
    },
    {
        name: 'lower-entrance-right-wall',
        mass: 0,
        material: 'obstacleMaterial',
        position: [-1, -26.3, -116.6],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [1, 15.7, 1.4] }]
    },                                        
    {
        name: 'A1_wall_lower_right',
        mass: 0,
        material: 'obstacleMaterial',
        position: [18, -31.6, -136],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [20, 21, 18] }]
    },
    {
        name: 'A1_wall_lower_left',
        mass: 0,
        material: 'obstacleMaterial',
        position: [18, -31.6, -92.1],
        quaternion: [0, 0, 0, 1],
        shapes: [{ type: 'box', halfExtents: [20, 21, 18.1] }]
    }
]

export const chamberA = {
    visual: {
        className: 'instance',
        position: [0,0,0],
        rotation: [0,0,0,1],
        nodes: [
            { className: 'instance', group: 'static', url: 'assets/environment/chamber-a.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/scaffolding-a.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'instance', group: 'static', url: 'assets/environment/hob.vmf', position:[0,0,0], scale: vec3(1) },
            { className: 'light', type: 'spotlight', position: [-13, 10, -114], destination: [50, 2, -114], color: [1.0,0.3,0.3], angle: 0.45 * Math.PI, radius: 24.0, castShadow: false },
            { className: 'light', type: 'spotlight', position: [100, 64, -114], destination: [50, -30, -114], color: [0.5,0.54,0.6], angle: 0.45 * Math.PI, radius: 56.0, castShadow: true },
            { className: 'light', type: 'omnilight', position: [-6, 8, -114], color: [0.9,0.2,0.2], radius: 8.0, castShadow: false },
            { className: 'light', type: 'omnilight', position: [74.5, -30, -114.5], color: [0.36,1.0,1.6], radius: 24.0, castShadow: true },
            { className: 'emitter', type: 'fire', timeOffset: 0, position: [74.5, -32, -114.5] },
            { className: 'audio', url: 'assets/sounds/gas.mp3', position: [74.5, -32, -114.5], volume: 1.6, loop: true, startTime: 0 },
            
            { className: 'instance', group: 'decal', url: 'assets/effects/blood-a.png', position: [74.5, -32.6, -114.5], scale: vec3(2*14, 2*14, 2*14), rotation: quat.setAxisAngle(vec3.AXIS_X, 0.5 * Math.PI) },
            
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] },
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] },
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] },
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] },
            { className: 'instance', group: 'dynamic', url: 'assets/environment/cargo.vmf', position: [0, 0, 0], scale: [4,4,4] }
        ]
    },
    behavior: [],
    imposter: [
        ...buildWalls(),
        ...[
            [98, 4, -93],
            [102, 4, -102],
            [101.5, 8, -101.5],
            [93, 4, -96],
            [93.5, 8, -95.5]
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
            position: [-2+1,-40.6,-114-0.5],
            normal: [-1,0,0]
        }, {
            position: [-18+1,2,-114],
            normal: [-1,0,0]
        }],
        start: [88, -20, -115]
    }
}