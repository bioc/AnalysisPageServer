// Gulp and plugins
var
    gulp = require("gulp"),    
    gulpr = require("gulp-requirejs-simple"),
    gulpLess = require("gulp-less"),
    gulpUglify = require("gulp-uglify"),
    gulpRename = require("gulp-rename"),
    gulpReplace = require("gulp-replace-task");

var pkg = require('./package.json');

// Node modules
var
    merge = require("deeply");

// Config
var
    requireJsOptimizerConfig = {
        mainConfigFile: "requirejs-config.js",
        baseUrl: "js/src",
        out: "concatenated-modules.js",
        include: ["requireLib"],
        wrapShim: true,
        excludeShallow: ["d3", "config"]
    };

gulp.task("buildRequirejsAPS", gulpr(merge(requireJsOptimizerConfig, {
            name: "init-aps",
            out: "dist-aps/js/concatenated-modules.js",
//            optimize: "none",
            insertRequire: ["init-aps"],
            paths: {
                config: "../config-aps"
            }
})));

gulp.task("buildRequirejsAPSS", gulpr(merge(requireJsOptimizerConfig, {
            name: "init-apss",
            out: "dist-apss/js/concatenated-modules.js",
//            optimize: "none",
            insertRequire: ["init-apss"],
            paths: {
                config: "../config-apss"
            }
})));

gulp.task("buildRequirejsEP", gulpr(merge(requireJsOptimizerConfig, {
            name: "init-ep",
            out: "dist-ep/js/concatenated-modules.js",
//            optimize: "none",
            insertRequire: ["init-ep"],
            paths: {
                config: "../config-ep"
            }
})));

gulp.task("buildLess", function () {
  gulp.src("./less/ep-main.less")
        .pipe(gulpLess({
            compress: true,
//            relativeUrls: true,
//            rootpath: "css/"
        }))
        .pipe(gulpRename("concatenated.css"))
        .pipe(gulp.dest("./dist-ep/css"))
        .pipe(gulp.dest("./dist-aps/css"))
        .pipe(gulp.dest("./dist-apss/css"));
  gulp.src("css/svg.css")
            .pipe(gulp.dest("dist-ep/css"))
            .pipe(gulp.dest("dist-aps/css"))
            .pipe(gulp.dest("dist-apss/css"));
});

gulp.task("copyAssetsEP", function() {
    gulp.src("./bower_components/fontawesome/fonts/*")
            .pipe(gulp.dest("./dist-ep/fonts"));
    gulp.src("./bower_components/bootstrap/img/*")
            .pipe(gulp.dest("./dist-ep/img"));
    gulp.src("./bower_components/select2/select2.png")
            .pipe(gulp.dest("./dist-ep/css"));
    gulp.src("./js/src/workers/TableDataWorker.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("./dist-ep/js/workers"));
    // worker dependencies
    gulp.src("bower_components/underscore/underscore.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("dist-ep/js/workers/lib"));
    // excluded libraries
    gulp.src("bower_components/d3/d3.min.js")
            .pipe(gulpRename("d3.js"))
            .pipe(gulp.dest("dist-ep/js"));
    // config files
    gulp.src("requirejs-config.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("./dist-ep/js"));
    gulp.src("js/config-ep.js")
            .pipe(gulpRename("config.js"))
            .pipe(gulpReplace({patterns: [{match: "version", replacement: pkg.version}]}))
            .pipe(gulp.dest("./dist-ep/js"));
    // entry file
    gulp.src("./expressionplot-app.html")
            .pipe(gulpReplace({patterns: [{match: "version", replacement: pkg.version}]}))
            .pipe(gulp.dest("./dist-ep"));
});

gulp.task("copyAssetsAPS", function() {
    gulp.src("./bower_components/fontawesome/fonts/*")
            .pipe(gulp.dest("./dist-aps/fonts"));
    gulp.src("./bower_components/bootstrap/img/*")
            .pipe(gulp.dest("./dist-aps/img"));
    gulp.src("./bower_components/select2/select2.png")
            .pipe(gulp.dest("./dist-aps/css"));
    gulp.src("./js/src/workers/TableDataWorker.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("./dist-aps/js/workers"));
    // worker dependencies
    gulp.src("bower_components/underscore/underscore.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("dist-aps/js/workers/lib"))
    // excluded libraries
    gulp.src("bower_components/d3/d3.min.js")
            .pipe(gulpRename("d3.js"))
            .pipe(gulp.dest("dist-aps/js"));
    // config files
    gulp.src("requirejs-config.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("./dist-aps/js"));
    gulp.src("js/config-aps.js")
            .pipe(gulpRename("config.js"))
            .pipe(gulpReplace({patterns: [{match: "version", replacement: pkg.version}]}))
            .pipe(gulp.dest("./dist-aps/js"));
    // entry file
    gulp.src("./analysis-page-server.html")
            .pipe(gulpReplace({patterns: [{match: "version", replacement: pkg.version}]}))
            .pipe(gulp.dest("./dist-aps"));
});

gulp.task("copyAssetsAPSS", function() {
    gulp.src("./bower_components/fontawesome/fonts/*")
            .pipe(gulp.dest("./dist-apss/fonts"));
    gulp.src("./bower_components/bootstrap/img/*")
            .pipe(gulp.dest("./dist-apss/img"));
    gulp.src("./bower_components/select2/select2.png")
            .pipe(gulp.dest("./dist-apss/css"));
    gulp.src("./js/src/workers/TableDataWorker.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("./dist-apss/js/workers"));
    // worker dependencies
    gulp.src("bower_components/underscore/underscore.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("dist-apss/js/workers/lib"));
    // excluded libraries
    gulp.src("bower_components/d3/d3.min.js")
            .pipe(gulpRename("d3.js"))
            .pipe(gulp.dest("dist-apss/js"));
    // config files
    gulp.src("requirejs-config.js")
            .pipe(gulpUglify())
            .pipe(gulp.dest("./dist-apss/js"));
    gulp.src("js/config-apss.js")
            .pipe(gulpRename("config.js"))
            .pipe(gulpReplace({patterns: [{match: "version", replacement: pkg.version}]}))
            .pipe(gulp.dest("./dist-apss/js"));
    // entry file
    gulp.src("./analysis-page-server-static.html")
            .pipe(gulpReplace({patterns: [{match: "version", replacement: pkg.version}]}))
            .pipe(gulp.dest("./dist-apss"));
});

gulp.task("buildEP", ["buildRequirejsEP", "buildLess", "copyAssetsEP"], function() {
    
});

gulp.task("buildAPS", ["buildRequirejsAPS", "buildLess", "copyAssetsAPS"], function() {
    
});

gulp.task("buildAPSS", ["buildRequirejsAPSS", "buildLess", "copyAssetsAPSS"], function() {
    
});

gulp.task("default", ["buildEP", "buildAPS", "buildAPSS"], function() {});