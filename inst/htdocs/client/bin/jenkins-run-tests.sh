#!/bin/sh

source /gne/research/share/etc/profile

## Jenkins build script for ExpressionPlot Frontend
## USES: git, node.js, node's npm, gulp.js, phantomjs

## load modules
module load apps/node.js/4.3.1

if [ ! -d node_modules/jspm ]; then
    ## install dev tools (listed in package.json)
    npm install
    cd node_modules
    # mocha-casperjs overrides PHANTOMJS_EXECUTABLE so I need to point to correct
    # phantomjs binary
    ln -s phantomjs-prebuilt phantomjs
    cd ..
fi

echo "    printenv"
echo "    ================================================"
printenv

# https://github.com/jspm/jspm-cli/blob/master/docs/registries.md
echo "    jspm registry export github"
echo "    ================================================"
./node_modules/.bin/jspm registry export github

# during development some packages might have been uninstalled so perform some clean-up
./node_modules/.bin/jspm clean
## install frontend dependencies (listed in package.json under "jspm" key)
# this is a reproducible install (versions are taken exactly from system.config.js)
./node_modules/.bin/jspm install

echo "    copy gulp.config.dist.js to gulp.config.js"
echo "    ================================================"
if [ ! -f gulp.config.js ]; then
    cp gulp.config.dist.js gulp.config.js
fi
#
# export PATH=$PATH:$JENKINS_HOME/jobs/$JOB_NAME/workspace/node_modules/.bin/
#
# export PATH=$PATH:.
# https://docs.npmjs.com/cli/run-script
echo "    npm run test-unit -- jenkins ..."
echo "    ================================================"
npm run test-unit -- jenkins
echo "    npm run test-e2e -- jenkins ..."
echo "    ================================================"
npm run test-e2e -- jenkins
