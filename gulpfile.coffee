gulp = require("gulp")
coffee  = require 'gulp-coffee'
gutil   = require 'gulp-util'
plumber = require 'gulp-plumber'
connect = require 'gulp-connect'
concat = require 'gulp-concat'

gulp.task "default", ["watch"]

gulp.task 'coffee', ->
  gulp.src('coffee/**/*.coffee')
  .pipe(plumber())
  .pipe(coffee({
    bare: true
   }))
  .pipe(gulp.dest('assets/js/script'))
  .on('error', gutil.log)

gulp.task 'script', ->
  gulp.src(['assets/js/script/app.js', 'assets/js/script/config.js', 'assets/js/script/Services/*.Service.js','assets/js/script/Factories/*.Factory.js','assets/js/script/Ctrl/*.Ctrl.js'])
    .pipe(concat('script.js'))
    .pipe(gulp.dest('assets/js'))


gulp.task 'watch', ()->
  gulp.watch('coffee/**/*.coffee', ['coffee', 'script'])
  .on 'change', (event)->
    console.log 'Fichier Modifier '+event.path


gulp.task "serve", ->
  connect.server
    root: "./"
    port: "1881"
    livereload: true

  return
