/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "d3", "d3.bacon"], 
function(Marionette, d3, d3asEventStream) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:plot:initialize-brush-zooming", this.initializeZooming, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        initializeZooming: function(svgView) {
            var brushendEventStream = d3asEventStream(svgView.d3.brushFunction, "brushend.epmarqueezoom");
            
            brushendEventStream
                    .takeUntil(svgView.getDestroyES())
                    .filter(this, "_isZoomMode", svgView.model)
                    .onValue(this, "_onBrushend", svgView);
        },
        _isZoomMode: function(model) {
            return model.get("interactionMode") === "zoom";
        },
        _onBrushend: function(svgView, e) {
            this.zoomByExtent(svgView, e.target.extent());
            e.target.clear();
            e.target(svgView.d3.brush);
        },
        zoomByExtent: function(svgView, extent) {
            var x0 = extent[0][0], y0 = extent[0][1],
                x1 = extent[1][0], y1 = extent[1][1],
                width = Math.abs(x1-x0), height = Math.abs(y1-y0);
            // do not zoom if user accidentally selects a small area
            width > 10 && height > 10 && svgView.updateViewBox(x0, y0, width, height);
        }
    });
});