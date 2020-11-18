const AnimationClip = (layer, repeat = -1, scale = 1) => Object.setPrototypeOf({
    layer, repeat, scale,
    time: 0.0,
    weight: 1.0
}, AnimationClip.prototype)

AnimationClip.prototype = {
    crop: function(duration){
        if(this.time > duration){
            if(this.repeat != -1) this.repeat = Math.max(this.repeat - Math.floor(this.time / duration), 0)
            this.time = this.time % duration
        }
        return this.time
    }
}

export {AnimationClip}