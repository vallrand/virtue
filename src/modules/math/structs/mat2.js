import {unrollVectorBinaryOperator, unrollVectorScalarOperator, unrollVectorUnaryOperator} from '../abstract'

const mat2 = (...args) => new Float32Array(args.length ? (args.length === 4 ? args : Array(4).fill(args[0])) : 4)

mat2.copy = unrollVectorUnaryOperator(4, mat2, '')

mat2.identity = (out = mat2()) => {
	out[0] = 1; out[1] = 0
	out[2] = 0; out[3] = 1
	return out
}

mat2.transpose = (m, out = mat2()) => {
	if(out === m){
		const tm1 = m[1]
		out[1] = m[2]
		out[2] = m1
	}else{
		out[0] = m[0]; out[1] = m[2]
		out[2] = m[1]; out[3] = m[3]
	}
	return out
}

mat2.invert = (m, out = mat2()) => {
	const m00 = m[0], m01 = m[1],
		  m10 = m[2], m11 = m[3],
          det = (m00 * m11 - m10 * m01),
		  invDet = det ? 1.0 / det : 0
	out[0] = invDet * m11
	out[1] = invDet * -m01
	out[2] = invDet * -m10
	out[3] = invDet * m00
	return out
}

export {mat2}