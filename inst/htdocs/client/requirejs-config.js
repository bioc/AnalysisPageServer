require.config({
  shim: {
    "canvas-toBlob": [
      "Blob"
    ],
    canvg: [
      "rgbcolor"
    ],
    d3: {
      exports: "d3"
    },
    "backbone.eventstreams": [
      "backbone",
      "bacon"
    ],
    "jquery-resizable-columns": [
      "jquery"
    ],
    select2: [
      "jquery"
    ]
  },
  wrapShim: true,
  baseUrl: "js/src/",
  paths: {
    requireLib: "../../bower_components/requirejs/require",
    config: "../config-ep",
    Blob: "../../bower_components/Blob/Blob",
    FileSaver: "../../bower_components/FileSaver/FileSaver",
    Sortable: "../../bower_components/Sortable/Sortable",
    async: "../../bower_components/async/lib/async",
    backbone: "../../bower_components/backbone/backbone",
    "backbone-query-parameters": "../../bower_components/backbone-query-parameters/backbone.queryparams",
    "backbone.eventstreams": "../../bower_components/backbone.eventstreams/dist/backbone.eventstreams",
    "backbone.localstorage": "../../bower_components/backbone.localstorage/backbone.localStorage",
    bacon: "../../bower_components/bacon/dist/Bacon",
    "bacon.jquery": "../../bower_components/bacon.jquery/dist/bacon.jquery",
    "bacon.model": "../../bower_components/bacon.model/dist/bacon.model",
    bootstrap: "../../bower_components/bootstrap/docs/assets/js/bootstrap",
    "canvas-toBlob": "../../bower_components/canvas-toBlob.js/canvas-toBlob",
    "canvg.bundle": "../../bower_components/canvg/dist/canvg.bundle.min",
    d3: "../../bower_components/d3/d3",
    fontawesome: "../../bower_components/fontawesome/fonts/*",
    hogan: "../../bower_components/hogan/web/builds/3.0.2/hogan-3.0.2.amd",
    jquery: "../../bower_components/jquery/dist/jquery",
    "jquery-resizable-columns": "../../bower_components/jquery-resizable-columns/dist/jquery.resizableColumns.min",
    requirejs: "../../bower_components/requirejs/require",
    "requirejs-text": "../../bower_components/requirejs-text/text",
    "requirejs-web-workers": "../../bower_components/requirejs-web-workers/src/worker",
    rgbcolor: "../../bower_components/rgbcolor/index",
    select2: "../../bower_components/select2/select2",
    underscore: "../../bower_components/underscore/underscore"
  },
  packages: [

  ]
});