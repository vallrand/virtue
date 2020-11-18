import 'regenerator-runtime/runtime'

if(typeof(global) !== 'undefined')global.window = global

if(!window.performance)
    window.performance = {
        now: (startOffset =>  _ => Date.now() - startOffset)(Date.now())
    }

const decodeText = window.TextDecoder ? TextDecoder.prototype.decode.bind(new TextDecoder('utf-8'))
: (array) => {
	let out = '',
		idx = array.length
	while(idx--)
		out = String.fromCharCode(array[idx]) + out
	return out
}

export {decodeText}