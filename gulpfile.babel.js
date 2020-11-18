import gulp from 'gulp'
import del from 'del'
import merge from 'merge-stream'
import util from 'gulp-util'
import babel from 'gulp-babel'
import rollup from 'rollup-stream'
import rollupIncludePaths from 'rollup-plugin-includepaths'
import resolve from 'rollup-plugin-node-resolve'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import sourcemaps from 'gulp-sourcemaps'
import rename from 'gulp-rename'
import uglify from 'gulp-uglify'
import connect from 'gulp-connect'

import {fbx_to_vmf} from './tasks'

const path = {
	input: 'src/input.js',
	output: 'output/'
}

gulp.task('clean', callback => del(['output'], callback))

gulp.task('watch', _ => {
	gulp.watch(['src/**/*'], ['compile'])
	gulp.watch(['static/**/*'], ['sync'])
})

gulp.task('sync',
          _ => merge(
        gulp.src('static/index.html'),
        gulp.src('assets/**/*', {base: '.'}))
    .pipe(fbx_to_vmf())
	.pipe(gulp.dest(path.output))
	.pipe(connect.reload())
)

gulp.task('compile', _ =>
	rollup({
		input: path.input,
		format: 'es',
        plugins: [
            rollupIncludePaths({
                paths: ['src/']
            }),
            resolve()
        ],
		sourcemap: true
	})
	.on('error', function(error){
        console.error(error.stack)
        this.emit('end')
    })
	.pipe(source(path.input))
	.pipe(buffer())
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(babel())
	//.pipe(uglify())
	.pipe(rename('main.js'))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(path.output))
	//.pipe(connect.reload())
	)

gulp.task('connect', _ => connect.server({
	name: 'Dev App',
	root: path.output,
	port: 8888,
	livereload: false,
	https: false,
	middleware: _ => [
		(req, resp, next) => {
			resp.setHeader('Access-Control-Allow-Origin', '*')
			resp.setHeader('Access-Control-Allow-Methods', '*')
			resp.setHeader('Access-Control-Allow-Headers', '*')
			resp.setHeader('Access-Control-Expose-Headers', '*')
			next()
		}
	]
}))

gulp.task('default', ['connect', /*'sync',*/ 'compile', 'watch'])
gulp.task('build', ['clean', 'sync', 'compile'])
