import {logger} from '../../debug/logger'
import {factory, Signal, path} from '../../util'

factory.declare('resource', (target, options) => {
    const xhr = new XMLHttpRequest(),
          url = options.url,
          extension = path(url).extension
    xhr.open('GET', encodeURIComponent(url), true)
    xhr.responseType = options.responseType || 'arraybuffer'
    
    return {
        load: _ => Signal((onSuccess, onError) => {
            logger.info('loader', `\u23E9 loading: ${url}`)
            xhr.onprogress = evt => !evt.lengthComputable || evt.loaded/evt.total
            xhr.onreadystatechange = _ => {
                if(xhr.readyState === XMLHttpRequest.DONE)
                    if(xhr.status === 200) onSuccess({data: xhr.response, extension})
                        else onError(xhr)
            }
            xhr.send(null)
        })
    }
})