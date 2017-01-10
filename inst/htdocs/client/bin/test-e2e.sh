#!/bin/bash
# Run with the context of npm-run-script
# https://docs.npmjs.com/cli/run-script

# if [ ! -f test/E2E/scenario1.js ]; then
    babel test/E2E/scenario1.es2015.js --out-file test/E2E/scenario1.js
# fi

if [ "$1" == "jenkins" ]; then
    mocha-casperjs --reporter=xunit --bail test/E2E/scenario1.js > test-results-casperjs-ep-scenario.xml
else
    mocha-casperjs --bail test/E2E/scenario1.js
fi

rm test/E2E/scenario1.js
