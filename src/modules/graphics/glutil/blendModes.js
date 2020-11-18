const GL_BLEND_MODES = {
    blend: gl => {
        gl.blendEquation(gl.FUNC_ADD)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    },
    add: gl => {
        gl.blendEquation(gl.FUNC_ADD)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    },
    multiply: gl => {
        gl.blendEquation(gl.FUNC_ADD)
        gl.blendFunc(gl.DST_COLOR, gl.ZERO)
    },
    subtract: gl => {
        gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    }
}

//TODO 


/*
gl.FUNC_ADD
gl.FUNC_SUBTRACT
gl.FUNC_REVERSE_SUBTRACT



gl.ZERO
gl.ONE
gl.SRC_COLOR
gl.ONE_MINUS_SRC_COLOR
gl.DST_COLOR
gl.ONE_MINUS_DST_COLOR
gl.SRC_ALPHA
gl.ONE_MINUS_SRC_ALPHA
gl.DST_ALPHA
gl.ONE_MINUS_DST_ALPHA
gl.CONSTANT_COLOR
gl.ONE_MINUS_CONSTANT_COLOR
gl.CONSTANT_ALPHA
gl.ONE_MINUS_CONSTANT_ALPHA
gl.SRC_ALPHA_SATURATE

*/

export {GL_BLEND_MODES}


//gl.blendFunc(gl.ONE, gl.ONE) //gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE)

//https://github.com/mrdoob/webgl-blendfunctions
    //TODO move to context state definitions
    //TODO add more blend modes
//    const blendModes = {
//        blend: {
//            src: gl.SRC_ALPHA,
//            dest: gl.ONE_MINUS_SRC_ALPHA
//        },
//        add: {
//            src:  gl.SRC_ALPHA,
//            dest: gl.ONE
//        },
//        multiply: {
//            src: gl.DST_COLOR,
//            dest: gl.ZERO
//        },
//        blend_premultiply: {
//            src:  gl.ONE,
//            dest: gl.ONE_MINUS_SRC_ALPHA
//        },
//        blend_no_alpha: {
//            src:  gl.SRC_COLOR,
//            dest: gl.ONE_MINUS_SRC_COLOR
//        },
//        subtract: {
//            src:  gl.SRC_ALPHA,
//            dest: gl.ONE_MINUS_SRC_ALPHA,
//            eq:   gl.FUNC_REVERSE_SUBTRACT
//        },
//        inverse: {
//            src:  gl.ONE_MINUS_DST_COLOR,
//            dest: gl.ONE_MINUS_SRC_COLOR
//        }
//    }
//    gl.enable( gl.BLEND );
//gl.blendEquation( gl.FUNC_ADD );
//gl.blendFunc( gl.CONSTANT_ALPHA, gl.SRC_COLOR );