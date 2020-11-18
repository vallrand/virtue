const setupPhysics = app => {
    defineMaterials: {
        const materials = V.physics.materialLibrary
        
        materials.obstacleMaterial = materials.createMaterial({name: 'obstacles'}) //TODO move to physics settings
        materials.ragdollMaterial = materials.createMaterial({name: 'ragdoll'})
        materials.playerMaterial = materials.createMaterial({name: 'player'})

        materials.createContactMaterial(materials.playerMaterial, materials.defaultContactMaterial, {
            collisionResponse: false
        })
        materials.createContactMaterial(materials.obstacleMaterial, materials.defaultContactMaterial, {
        })
        materials.createContactMaterial(materials.obstacleMaterial, materials.playerMaterial, {
            friction: 0.0,
            restitution: 0.0
        })
        
        materials.createContactMaterial(materials.ragdollMaterial, materials.ragdollMaterial, {
            collisionResponse: false
        })
    }
}

export {setupPhysics}