const setupParticleEffects = app => {
    let RangeSampler = V.graphics.RangeSampler,
        vec3 = V.math.vec3,
        quat = V.math.quat
    
    app.scene.defineParticleSystem({
        name: 'fire',
        group: 'billboarded',
        blend: 'add',
        texture: null,
        static: true,
        colorRamp: [
            [1, 1, 1, 1],
            [0.2, 0.8, 1, 1],
            [0, 0.2, 1, 1],
            [0, 0, 0.5, 0.5],
            [0, 0, 0, 0]
        ],
        count: 64,
        emitter: {
            worldVelocity: [0, 0, 0],
            worldAcceleration: [0, -9.8, 0]
        },
        particle: {
            lifeTime: 2,
            position: [0, 0, 0],
            startTime: (i, count, conf) => i * conf.lifeTime / count,
            velocity: RangeSampler([0, 1, 0], [0.8, 1.5, 0.8]),
            startSize: 1.2,
            acceleration: [0, 12, 0],
            endSize: 6,
            spinStart: 0,
            spinSpeed: RangeSampler(0, 4),
            color: [0.75, 0.75, 0.5, 1]
        }
    })
    
    app.scene.defineParticleSystem({
        name: 'fog',
        group: 'billboarded',
        blend: 'blend',
        texture: 'assets/effects/fog.png',
        colorRamp: [
            [0.8, 0.8, 0.8, 0],
            [0.8, 0.8, 0.8, 0.25],
            [0.8, 0.8, 0.8, 0.25],
            [0, 0, 0, 0]
        ],
        static: true,
        count: 36,
        frequency: 1,
        emitter: {
            worldVelocity: [0, 0, 0],
            worldAcceleration: [0, 0, 0]
        },
        particle: {
            lifeTime: 8,
            position: RangeSampler([0,5,0], [10,10,10]),
            startTime: (i, count, conf) => i * conf.lifeTime / count,
            velocity: RangeSampler([-0.1,-0.1,-0.1], [0.1,0.1,0.1]),
            startSize: RangeSampler(16, 24),
            acceleration: [0, 0, 0],
            endSize: RangeSampler(20, 30),
            spinStart: RangeSampler(0, 2 * Math.PI),
            spinSpeed: RangeSampler(-0.2, 0.2),
            color: [1, 1, 1, 1]
        }
    })
    
    app.scene.defineParticleSystem({
        name: 'projectile',
        group: 'oriented',
        blend: 'add',
        texture: 'assets/effects/projectile.png',
        colorRamp: [
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [0, 0, 0, 0]
        ],
        count: 64,
        frequency: 0.1,
        emitter: {
            worldVelocity: [0, 0, 0],
            worldAcceleration: [0, 0, 0],
            timeRange: 4 * 128, //TODO equals lifeTime ? loop params etc?  default?
            frameCount: 8,
            frameDuration: 0.36 * 1/8, //TODO again? lifetime/frameCount? - default
        },
        particle: {
            lifeTime: 1,
            frameStart: 0,
            position: [0,0,0],
            startTime: (i, count, conf) => i * conf.lifeTime / count,
            velocity: [0, 0, 0],
            startSize: 4,
            acceleration: [0, 0, 0],
            endSize: 0,
            spinStart: RangeSampler(0, Math.PI),
            spinSpeed: RangeSampler(0, 0.1),
            orientation: _ => quat.normalize([Math.random(), Math.random(), Math.random(), Math.random()]),
			//quat.setAxisAngle(vec3.AXIS_Y, Math.PI / 2),
            color: [1, 1, 1, 1]
        }
    }) 
}

export {setupParticleEffects}