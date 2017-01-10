#!/bin/bash

# Author: Adrian Nowicki <adrian.nowicki@contractors.roche.com>
#
# It expects that it is called from the root of the project

export GULP=node_modules/.bin/gulp
export JSPM=node_modules/.bin/jspm

if ! [ "$(ls -A ./node_modules)" ]; then
    echo "node_modules is empty. Running npm install..."
    npm install
    cd node_modules
    # mocha-casperjs overrides PHANTOMJS_EXECUTABLE so I need to point to correct
    # phantomjs binary
    ln -s phantomjs-prebuilt phantomjs
    cd ..
fi

if ! [ "$(ls -A ./jspm_packages)" ]; then
    echo "    jspm_packages is empty. Running jspm install..."
    $JSPM install
fi

if [ "$1" = "EP" ]; then
    echo "    Running gulp ep build..."
    $GULP ep build
elif [ "$1" = "APS" ]; then
    echo "    Running gulp buildAPS..."
    $GULP aps build
elif [ "$1" = "APSS" ]; then
    echo "    Running gulp buildAPSS..."
    $GULP apss build
else
    echo "    Running gulp for all targets..."
    $GULP
fi
