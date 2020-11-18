const TupleDictionary = _ => { //TODO move into utils?
    const dataMap = Object.create(null)
    return {
        get: (i, j) => i > j ? dataMap[j+'-'+i] : dataMap[i+'-'+j],
        set: (i, j, value) => dataMap[i > j ? j+'-'+i : i+'-'+j] = value,
        clear: _ => Object.keys(dataMap).forEach(key => delete dataMap[key])
    }
}

const materialLibrary = (_ => {
    const materials = [],
          contactMaterials = [], //TODO removing and id update
          contactMaterialMap = TupleDictionary()
    
    return {
        get defaultContactMaterial(){ return contactMaterials[0] },
        createMaterial: options => {
            const material = Object.assign({
                id: materials.length,
                name: ''
            }, options || {})
            materials.push(material)
            return material
        },
        createContactMaterial: (materialA, materialB = materialA, options) => {
            const contactMaterial = Object.assign({
                id: contactMaterials.length,
                materials: [materialA, materialB],
                friction: 0.3,
                restitution: 0.3,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e7,
                frictionEquationRelaxation: 3,
                collisionResponse: true
            }, options || {})
            contactMaterials.push(contactMaterial)
            contactMaterialMap.set(materialA.id, materialB.id, contactMaterial)
            return contactMaterial
        },
        getContactMaterial: (materialA, materialB) => materialA && materialB && 
        contactMaterialMap.get(materialA.id, materialB.id) || contactMaterials[0]
    }
})()

materialLibrary.createContactMaterial(materialLibrary.createMaterial({name:'default'}), undefined, {friction: 0.3, restitution: 0.0})

export {materialLibrary}