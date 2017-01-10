/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import d3 from "d3";
import d3asEventStream from "d3.bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:initialize-brush-zooming", this.initializeZooming, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:initialize-brush-zooming");
    },
    initializeZooming(svgView) {
        var brushendEventStream = d3asEventStream(svgView.d3.brushFunction, "brushend.epmarqueezoom");

        brushendEventStream
                .takeUntil(svgView.getDestroyES())
                .filter(this, "_isZoomMode", svgView.model)
                .onValue(this, "_onBrushend", svgView);
    },
    _isZoomMode(model) {
        return model.get("interactionMode") === "zoom";
    },
    _onBrushend(svgView, e) {
        this.zoomByExtent(svgView, e.target.extent());
        e.target.clear();
        e.target(svgView.d3.brush);
    },
    zoomByExtent(svgView, extent) {
        var x0 = extent[0][0], y0 = extent[0][1],
            x1 = extent[1][0], y1 = extent[1][1],
            width = Math.abs(x1-x0), height = Math.abs(y1-y0);
        // do not zoom if user accidentally selects a small area
        width > 10 && height > 10 && svgView.updateViewBox(x0, y0, width, height);
    }
});
