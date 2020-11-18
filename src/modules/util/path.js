const path = fullpath => ({
    get extension(){ return fullpath.split('.').pop() },
    get base(){ return fullpath.substr(0, fullpath.lastIndexOf('/') + 1) || fullpath }
})

export {path}