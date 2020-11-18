export const SynchronizeDynamic = entity => {
    const imposters = entity.imposter.filter(imposter => imposter.mass > 0)
    const visuals = entity.visual.elements.filter(instance => instance.delegate && instance.delegate.group === 'dynamic')
    visuals.forEach(instance => instance.parent = null)
    
    return {
        update: (deltaTime, updateContext) => null,
        synchronize: _ => {
            for(let i = imposters.length - 1; i >= 0; i--){
                const imposter = imposters[i]
                const visual = visuals[i]
                
                visual.position = imposter.position
                visual.rotation = imposter.quaternion
            }
        },
        clear: _ => null
    }
}