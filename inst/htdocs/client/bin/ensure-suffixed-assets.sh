#!/bin/bash

# Please run from the main project directory

function rename {
    cd $1
    cp bundle.css `cat rev-manifest.json | jq --raw-output '.["bundle.css"]'`
    cp bundle.js `cat rev-manifest.json | jq --raw-output '.["bundle.js"]'`
    cp config.js `cat rev-manifest.json | jq --raw-output '.["config.js"]'`
    cd ..
}

if [ "$1" = "EP" ]; then
    echo "    Ensuring suffixed assets in dist-ep subdirectory..."
    rename dist-ep
elif [ "$1" = "APS" ]; then
    echo "    Ensuring suffixed assets in dist-aps subdirectory..."
    rename dist-aps
elif [ "$1" = "APSS" ]; then
    echo "    Ensuring suffixed assets in dist-apss subdirectory..."
    rename dist-apss
else
    echo "    Ensuring suffixed assets in all dist-* subdirectories..."
    rename dist-ep
    rename dist-aps
    rename dist-apss
fi
