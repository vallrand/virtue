const Pool = factoryFunction => {
    const pool = []
    let index = 0
    return {
        get size(){ return pool.length },
        allocate: size => {
            let extend = Math.max(pool.length - size, 0)
            while(extend--) pool.push(factoryFunction(index++))
        },
        clear: _ => pool.length = 0,
        obtain: _ => pool.pop() || factoryFunction(index++),
        release: (...items) => pool.push(...items)
    }
}

const PoolManager = globalPool => {
    const pool = Pool(id => {
        const manager = Object.create(null),
              trackedItems = []
        let item = null
        return Object.assign(manager, {
            release: _ => {
                globalPool.release.apply(globalPool, trackedItems)
                pool.release(manager)
                trackedItems.length = 0
            },
            obtain: _ => {
                item = globalPool.obtain()
                trackedItems.push(item)
                return item
            }
        })
    })
    return pool.obtain.bind(pool)
}

const ObjectPool = factoryFunction => { //TODO check if necessary
    const pool = Pool(factoryFunction)
    Object.assign(pool, {
        obtain: (obtain => {
            const item = obtain()
            item.release = pool.release.bind(pool, item)
            return item
        })(pool.obtain)
    })
    return pool
}

export {Pool, PoolManager, ObjectPool}