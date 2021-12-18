const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const replace = require('gulp-replace');
const browsersync = require('browser-sync').create();

const files = {
	scssPath: './dist/scss/**/*.scss',
	jsPath: './dist/js/**/*.js',
};

function scssTask() {
	return src(files.scssPath, { sourcemaps: true }) // set source and turn on sourcemaps
		.pipe(sass()) // compile SCSS to CSS
		.pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
		.pipe(dest('./dist/css', { sourcemaps: '.' })); // put final CSS in dist folder with sourcemap
}

function jsTask() {
	return src(
		[
			files.jsPath,
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
		],
		{ sourcemaps: true }
	)
		.pipe(concat('all.js'))
		.pipe(terser())
		.pipe(dest('dist', { sourcemaps: '.' }));
}

function cacheBustTask() {
	var cbString = new Date().getTime();
	return src(['./dist/index.html'])
		.pipe(replace(/cb=\d+/g, 'cb=' + cbString))
		.pipe(dest('.'));
}

function browserSyncServe(cb) {
	browsersync.init({
		server: {
			baseDir: '.',
		},
		notify: {
			styles: {
				top: 'auto',
				bottom: '0',
			},
		},
	});
	cb();
}
function browserSyncReload(cb) {
	browsersync.reload();
	cb();
}

function watchTask() {
	watch(
		[files.scssPath, files.jsPath],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(scssTask, jsTask), cacheBustTask)
	);
}

function bsWatchTask() {
	watch('index.html', browserSyncReload);
	watch(
		[files.scssPath, files.jsPath],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(scssTask, jsTask), cacheBustTask, browserSyncReload)
	);
}
exports.default = series(parallel(scssTask, jsTask), cacheBustTask, watchTask);

exports.bs = series(
	parallel(scssTask, jsTask),
	cacheBustTask,
	browserSyncServe,
	bsWatchTask
);
