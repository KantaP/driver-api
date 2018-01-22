var path = require('path');
var gulp = require('gulp');
var watch = require('gulp-watch');
var gutil = require('gulp-util');
var argv = require('minimist')(process.argv);
var gulpif = require('gulp-if');
var prompt = require('gulp-prompt');
var rsync = require('gulp-rsync');
var exec = require('child_process').exec;


function throwError(taskName, msg) {
  throw new gutil.PluginError({
      plugin: taskName,
      message: msg
    });
}

gulp.task('webpack', function () {
	// Build souce files to be available to use ES6 (type script) to JS//
    exec('webpack', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
})

gulp.task('deploy', function () {
    // Dirs and Files to sync
    // Create an array that contains the files/directories/globs that you want to be included in your deploy. These are your “build” or “dist” files
    rsyncPaths = ['build', './webservice.js', './package.json'];
    // Default options for rsync
    rsyncConf = {
        progress: true,
        incremental: true,
        relative: true,
        emptyDirectories: true,
        recursive: true,
        clean: true,
        exclude: [],
    };
    // Staging
    if (argv.staging) {

        rsyncConf.hostname = ''; // hostname
        rsyncConf.username = ''; // ssh username
        rsyncConf.port = 0; // ftp port
        rsyncConf.destination = ''; // path where uploaded files go
        // Production
    } else if (argv.production) {

        rsyncConf.hostname = '54.194.4.174'; // hostname
        rsyncConf.username = 'webservice'; // ssh username
        rsyncConf.port = 21; // ftp port
        rsyncConf.destination = ''; // path where uploaded files go
        // Missing/Invalid Target  
    } else {
        throwError('deploy', gutil.colors.red('Missing or invalid target'));
    }
    // Use gulp-rsync to sync the files 
    return gulp.src(rsyncPaths)
        .pipe(gulpif(
            argv.production,
            prompt.confirm({
                message: 'Heads Up! Are you SURE you want to push to PRODUCTION?',
                default: false
            })
        ))
        .pipe(rsync(rsyncConf));
})


gulp.task('delete', function () {
    exec('pm2 delete webservice.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
})

gulp.task('start', function () {
    exec('pm2 start webservice.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
})

gulp.task('restart', function () {
    exec('pm2 restart webservice.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
})

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['webpack']);
    gulp.watch('build/*js', ['restart']);
});

gulp.task('default', ['watch']); 