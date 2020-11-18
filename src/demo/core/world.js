const World = app => { //TODO evaluate if that needs to be in core or is it game specific?
    const scene = app.scene,
          physics = app.physics,
          entities = [],
          procedures = []
    
    app.addEventListener('update', deltaTime => procedures.forEach(regulation => regulation.update(deltaTime)))
    scene.addEventListener('update', _ => procedures.forEach(regulation => regulation.synchronize()))
    
    function deserializeVisuals(options){
        const { nodes = [], className } = options
        options = Object.assign(Object.create(null), options)
        delete options.nodes
        delete options.className
        
        switch(className){
            case 'instance': return app.scene.createInstance(options).addElement(...nodes.map(deserializeVisuals))
            case 'light': return app.scene.createLight(options)
            case 'emitter': return app.scene.createParticleEmitter(options)
            case 'liquid': return app.scene.createLiquidSurface(options)
            case 'audio': return app.scene.createAudioSource(options)
            default: throw new Error(`Class "${className}" not defined!`)
        }
    }
    
    return {
        addEntity: entity => {
            entity.visual = deserializeVisuals(entity.visual)
            entity.solidGeometry = scene.addSolidGeometry(entity.imposter)
            entity.imposter = V.physics.deserialize(entity.imposter).map(body => physics.addBody(body)) //TODO physics initiation somewhere else?
            entity.behavior = entity.behavior.map(initRegulation => initRegulation(entity))
            entity.behavior.forEach(regulation => regulation.synchronize())
            procedures.push(...entity.behavior)
            entities.push(entity)
            //entity.remove = _ => {} //TODO
            //TODO add into physics world only here?, same for visuals?, have this a main factory function
            
            return entity
        },
        removeEntity: entity => {
            let idx = entities.indexOf(entity)
            if(idx == -1) return false
            entities.splice(idx, 1)
            entity.behavior.forEach(regulation => {
                procedures.remove(regulation)
                regulation.clear()
            })
            entity.imposter.forEach(imposter => physics.removeBody(imposter))
            entity.visual && entity.visual.delete()
            entity.solidGeometry && scene.removeSolidGeometry(entity.solidGeometry)
        }
    }
}

export {World}