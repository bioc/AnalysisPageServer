#!/bin/sh

source /gne/research/share/etc/profile

## Jenkins build script for ExpressionPlot Frontend
## USES: git, node.js, node's npm, gulp.js, phantomjs

## load modules
module load apps/node.js

## install dev tools (listed in package.json)
npm install

## install frontend dependencies (listed in bower.json)
./node_modules/bower/bin/bower install --force-latest

export PATH=$PATH:$JENKINS_HOME/jobs/$JOB_NAME/workspace/node_modules/.bin/

export PATH=$PATH:.

mocha-casperjs --reporter=xunit --bail test/E2E/scenario1.js > test-results-casperjs-ep-scenario.xml
mocha-phantomjs --reporter=xunit test/Unit/SpecRunner.html > test-results.xml
