/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import config from "config";
import "canvg";
import "canvas-toBlob";
import saveAs from "FileSaver";
import "Blob";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:svg:initialize-save-as", this.initializeSaveAs, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:svg:initialize-save-as");
    },
    initializeSaveAs(svgView, menuView) {
        menuView.on("download:png", args => this._onDownloadPng(svgView, args));
        menuView.on("download:svg", args => this._onDownloadSvg(svgView, args));
    },
    svgToCanvas(svgEl) {
        return new Promise(resolve => {
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
                renderCallback() {
                    svgEl.setAttribute("width", clientWidth);
                    svgEl.setAttribute("height", clientHeight);
                    resolve(canvas);
                }
            });
        });

    },
    canvasToBlob(canvas) {
        return new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
    },
    textToBlob(mimeType, text) {
        return new Blob([text], {type: mimeType});
    },
    svgToText(svgEl) {
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
    _onDownloadPng(svgView, args) {
        args.view.ui.downloadPngBtn.prop("disabled", true);
        svgView.getBrushBehaviorTarget().style("display", "none");
        this.svgToCanvas(svgView.d3.svg.node())
                .then(canvas => this.canvasToBlob(canvas))
                .then(blob => {
                    args.view.ui.downloadPngBtn.prop("disabled", false);
                    svgView.getBrushBehaviorTarget().style("display", "block");
                    // saveAs(blob, svgView.getOption("pageLabel")+".png");
                    if (navigator.userAgent === config["phantomjs.userAgent"]) {
                        window.open(window.URL.createObjectURL(blob));
                    }
                    else {
                        saveAs(blob, svgView.getOption("pageLabel")+".png");
                    }
                });
    },
    _onDownloadSvg(svgView, args) {
        args.view.ui.downloadSvgBtn.prop("disabled", true);
        svgView.getBrushBehaviorTarget().style("display", "none");
        this.svgToText(svgView.d3.svg.node())
                .then(text => this.textToBlob("image/svg+xml", text))
                .then(blob => {
                    args.view.ui.downloadSvgBtn.prop("disabled", false);
                    svgView.getBrushBehaviorTarget().style("display", "block");
                    // saveAs(blob, svgView.getOption("pageLabel")+".svg");
                    if (navigator.userAgent === config["phantomjs.userAgent"]) {
                        window.open(window.URL.createObjectURL(blob));
                    }
                    else {
                        saveAs(blob, svgView.getOption("pageLabel")+".svg");
                    }
                });
    }
});
