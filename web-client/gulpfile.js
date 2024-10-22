const gulp = require('gulp');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const javascriptObfuscator = require('gulp-javascript-obfuscator');
const sourcemaps = require('gulp-sourcemaps');

const version = 8;

gulp.task('scripts', function() {
  return gulp.src([
      'js/quantz_namespace.js',
      'js/locale_texts.js',
      'js/animation_controller.js',
      'js/indicator_controller.js',
      'js/button_controller.js',
      'js/balloon.js',
      'js/locale.js',
      'js/sign.js',
      'js/style_generator.js',
      'js/opus-decoder.js',
      'js/core.js',
      `./js/quantz-button-v${version}.js`
    ])
    //.pipe(concat('quantz-button.min.js')) // NOTE: should NOT be quantz-button.min.js
    .pipe(concat('quantz-button-v8.min.js')) // NOTE: should NOT be quantz-button.min.js
    .pipe(terser())
    .pipe(javascriptObfuscator({
      // Obfuscation options can be specified here
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 1,
      disableConsoleOutput: true,
      //debugProtection: true,
      log: true,//false,
      //renameGlobals: true, // This uneble to access to Quantz namespace
      selfDefending: true,
      stringArray: true,
      rotateStringArray: true,
      stringArrayThreshold: 1,
    }))
    .pipe(gulp.dest('../web-server/views/js/dist/'));
});

gulp.task('scripts-dev', function() {
  return gulp.src([
      'js/quantz_namespace.js',
      'js/locale_texts.js',
      'js/animation_controller.js',
      'js/indicator_controller.js',
      'js/button_controller.js',
      'js/balloon.js',
      'js/locale.js',
      'js/sign.js',
      'js/style_generator.js',
      'js/opus-decoder.js',
      'js/core.js',
      `./js/quantz-button-v${version}.js`
    ])
    .pipe(sourcemaps.init())  // Initializes sourcemaps
    .pipe(concat('quantz-button-v8-dev.js')) // Concatenate without the 'min' suffix
    .pipe(sourcemaps.write('./maps')) // Writes sourcemaps files to the './maps' directory
    .pipe(gulp.dest('../web-server/views/js/dist/'));
});


gulp.task('default', gulp.series('scripts', 'scripts-dev'));