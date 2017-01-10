#!/bin/bash
# Run with the context of npm-run-script
# https://docs.npmjs.com/cli/run-script

gulp adjustSystemjsConfigForTest

if [ "$1" == "jenkins" ]; then
    phantomjs node_modules/mocha-phantomjs-core/mocha-phantomjs-core.js test/Unit/SpecRunner.html xunit '{"timeout": 20000, "loadTimeout": 20000}' > test-results.xml
else
    phantomjs node_modules/mocha-phantomjs-core/mocha-phantomjs-core.js test/Unit/SpecRunner.html spec '{"timeout": 20000, "loadTimeout": 20000, "useColors": true}'
fi
