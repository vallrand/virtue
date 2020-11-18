import {factory, Stream} from '../util'

factory.declare('screen', target => ({
        get width(){ 
            return Math.floor(Math.min(window.document.documentElement.clientWidth, window.innerWidth)) 
        },
        get height(){ 
            return Math.floor(Math.min(window.document.documentElement.clientHeight, window.innerHeight)) 
        },
        get dpr(){ return Math.round(window.devicePixelRatio) },
        resize: Stream(emit => window.addEventListener('resize', event => emit({screen: target}), false))
            .filter(Stream.minInterval(1000))
            .default({screen: target}),
        focus: Stream(emit => {
            const prefixes = ['webkit','moz','ms','o'],
                  visibilityProperty = ('hidden' in window.document) ? 'hidden' : prefixes
            .map(prefix => prefix + 'Hidden')
            .find(property => (property in window.document))
            if(visibilityProperty)
                window.document.addEventListener(visibilityProperty.slice(0, -6) + 'visibilitychange', event => emit({focus: !window.document[visibilityProperty]}), false)
        }),
        fullScreen: ['requestFullScreen','webkitRequestFullScreen','mozRequestFullScreen','msRequestFullScreen'].find(property => (property in window.document.body)),
        ua: navigator.userAgent
}))