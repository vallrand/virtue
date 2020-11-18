import {Stream} from '../../util'

const Observable = target => {
    const mutation = Stream(),
          cleanupProcedures = []
    
    return {
        mutation, cleanupProcedures,
        delete: _ => {
            mutation.clear()
            for(let i = 0; i < cleanupProcedures.length; i++)
                cleanupProcedures[i].call(target, target)
            cleanupProcedures.length = 0
        },
        onCleanup: procedure => cleanupProcedures.indexOf(procedure) == -1 && cleanupProcedures.push(procedure),
        propagate: (event, value, context) => mutation.onSuccess(event.context ? event : Observable.MutationEvent(event, value, context))
        
    }
}

Observable.MutationEvent = (event => (eventName, value, context) => {
    event.eventName = eventName
    event.value = value
    event.context = context
    return event
})(Object.create(null))

export {Observable}