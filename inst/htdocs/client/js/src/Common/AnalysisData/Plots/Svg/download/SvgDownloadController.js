/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "canvg.bundle", "canvas-toBlob", "FileSaver", "Blob", "promise-polyfill"],
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:plot:svg:initialize-save-as", this.initializeSaveAs, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        initializeSaveAs: function(svgView, menuView) {
            this.listenTo(menuView, "download:png", _.partial(this._onDownloadPng, svgView));
            this.listenTo(menuView, "download:svg", _.partial(this._onDownloadSvg, svgView));
        },
        svgToCanvas: function(svgEl) {
            return new Promise(function(resolve) {
                var canvas = document.createElement("canvas");
                var clientWidth = svgEl.getAttribute("width");
                var clientHeight = svgEl.getAttribute("height");
                var vbWidth = svgEl.viewBox.baseVal.width;
                var vbHeight = svgEl.viewBox.baseVal.height;
                svgEl.setAttribute("width", vbWidth);
                svgEl.setAttribute("height", vbHeight);
                $(canvas).css({
                    position:   "absolute",
                    left:       "-9999px",
                    top:        "-9999px"
                }).attr({
                    width:  vbWidth,
                    height: vbHeight
                });
                var serializedSvg = new XMLSerializer().serializeToString(svgEl);
                /*
                 * Safari XMLSerializer DOES cut off namespace prefixes of
                 * HREF attributes, as if it tries to be compatible with SVG 2.0
                 * @link http://www.w3.org/Graphics/SVG/WG/wiki/Href
                 *
                 * so I manually prepend them again so that SVG tags that use
                 * these attributes are properly drawn on canvas
                 *
                 * Firefox & Chrome XMLSerializers seem to preserve prefixes
                 *
                 */
                serializedSvg = serializedSvg
                        .replace(/ href=/g, " xlink:href=")
                        .replace(" xlink=", " xmlns:xlink=");

                canvg(canvas, serializedSvg, {
                    renderCallback: function() {
                        svgEl.setAttribute("width", clientWidth);
                        svgEl.setAttribute("height", clientHeight);
                        resolve(canvas);
                    }
                });
            });

        },
        canvasToBlob: function(canvas) {
            return new Promise(function(resolve) {
                canvas.toBlob(function(blob) {
                    resolve(blob);
                });
            });
        },
        textToBlob: function(mimeType, text) {
            return new Blob([text], {type: mimeType});
        },
        svgToText: function(svgEl) {
            var serializedSvg = new XMLSerializer().serializeToString(svgEl);
            /*
             * Safari XMLSerializer DOES cut off namespace prefixes of
             * HREF attributes, as if it tries to be compatible with SVG 2.0
             * @link http://www.w3.org/Graphics/SVG/WG/wiki/Href
             *
             * so I manually prepend them again so that SVG tags that use
             * these attributes are properly drawn on canvas
             *
             * Firefox & Chrome XMLSerializers seem to preserve prefixes
             *
             */
            serializedSvg = serializedSvg.replace(/ href=/g, " xlink:href=").replace(" xlink=", " xmlns:xlink=");

            return Promise.resolve(
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"+
                    serializedSvg
                    );
        },
        _onDownloadPng: function(svgView, args) {
            args.view.ui.downloadPngBtn.prop("disabled", true);
            svgView.getBrushBehaviorTarget().style("display", "none");
            this.svgToCanvas(svgView.d3.svg.node())
                    .then(_.bind(this.canvasToBlob, this))
                    .then(function(blob) {
                        args.view.ui.downloadPngBtn.prop("disabled", false);
                        svgView.getBrushBehaviorTarget().style("display", "block");
                        saveAs(blob, svgView.getOption("pageLabel")+".png");
                    });
        },
        _onDownloadSvg: function(svgView, args) {
            args.view.ui.downloadSvgBtn.prop("disabled", true);
            svgView.getBrushBehaviorTarget().style("display", "none");
            this.svgToText(svgView.d3.svg.node())
                    .then(_.bind(this.textToBlob, this, "image/svg+xml"))
                    .then(function(blob) {
                        args.view.ui.downloadSvgBtn.prop("disabled", false);
                        svgView.getBrushBehaviorTarget().style("display", "block");
                        saveAs(blob, svgView.getOption("pageLabel")+".svg");
                    })
                    .catch(function(e) {
                        console.log(e);
                    });
        }
    });
});
