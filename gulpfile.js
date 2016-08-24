var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');

var build = 'build';
var acpes6 = 'acp.es6';
var acpjs = 'acp.js';
var minjs = 'acp.min.js';

gulp.task('concat', function () {
    return gulp.src(['src/base/*.js', 'src/*.js'])
        .pipe(plumber())
        .pipe(concat(acpes6))
        .pipe(gulp.dest(build));
});

gulp.task('babel', ['concat'], function () {
    return gulp.src(build + '/' + acpes6)
        .pipe(plumber())
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(rename(acpjs))
        .pipe(gulp.dest(build));
});

gulp.task('uglify', ['babel'], function () {
    return gulp.src(build + '/' + acpjs)
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename(minjs))
        .pipe(gulp.dest(build));
});

gulp.task('default', ['uglify']);