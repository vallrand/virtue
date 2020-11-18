const tie = function(target, ...modules){
	modules.filter(instance => !!instance)
	.forEach(module => Object.getOwnPropertyNames(module)
	.forEach(property => Object.defineProperty(target, property, 
	Object.getOwnPropertyDescriptor(module, property))))
	return target
}

const factory = (core => {
	const map = Object.create(null)
	
	return tie(core, {
		declare: (location, provider) => (map[location] ? 
			map[location].push(provider)
			: map[location] = [provider], core),
		build: (location, options = Object.create(null)) => !map[location] ? null : map[location]
		.reduce((target, provider) => tie(target, provider(target, options) || {}), Object.create(null))
	})
})(Object.create(null))

export {tie, factory}