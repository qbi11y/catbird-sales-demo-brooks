var gulp        = require('gulp'),
    browserSync = require('browser-sync'),
    sass        = require('gulp-sass'),
    clean       = require('gulp-clean');

gulp.task('browser-sync', function() {
    console.log('running browser sync');
    browserSync.init({
        files: ['public/**/*.{html,scss,js}'],
        proxy: 'https://127.0.0.1:4430/'
    });
})

gulp.task('clean', function() {
    console.log('cleaning directory');
    return gulp.src(['../dist/public/**/'], {read: false})  //don't read the files just delete them
        .pipe(clean({force: true}));                //force the method to delete files that aren't in the working directory
})

gulp.task('sass', function() {
    console.log('running sass');
    gulp.src('public/scss/styles.scss')
        .pipe(sass())
        .pipe(gulp.dest('public/css'));
})

//----------------------------------------
//BUILD TASK
//Does all the stuff needed to get the application ready for production
//Runs Clean before running to delete the previous build
//-----------------------------------------
gulp.task('build', ['clean'], function() {
    console.log('building application');
    gulp.src(['public/**'])
        .pipe(gulp.dest('../dist/public'));
})


//watches the given path for any files to change, and executes the array of tasks when they do.
gulp.task('watch', ['browser-sync'], function() {
    console.log('watching stuff');
    gulp.watch('public/**/*.html');
    gulp.watch('public/scss/**/*.scss', ['sass']);
})

//gulp.task('default', ['clean', 'browser-sync']);