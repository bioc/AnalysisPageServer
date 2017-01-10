/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import d3 from "d3";
import d3asEventStream from "d3.bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:plot:initialize-brush", this.initializeBrush, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:plot:initialize-brush");
    },
    initializeBrush: function(svgView) {
        if (svgView.d3.pointsParent) {
            svgView.d3.brush = svgView.d3.pointsParent.insert("g", ".plot-point");
        }
        else {
            svgView.d3.brush = svgView.d3.surface.append("g");
        }
        svgView.d3.brush
            .attr("class", "brush")
            .style("display", "none");

        svgView.d3.brushFunction = d3.svg.brush();
        svgView.updateBrushDimensions(svgView.originalWidth, svgView.originalHeight);

        var brushendStream = d3asEventStream(svgView.d3.brushFunction, "brushend.epgeneral");

        svgView.shiftKeyPressed// Ctrl key was a modifier here but Mac Safari triggers context menu
                .filter(this, "_isZoomMode", svgView.model)
                .takeUntil(svgView.getDestroyES())
                .map(function(yes) { return yes ? "block" : "none"; })
                .onValue(svgView.d3.brush, "style", "display");

        var brushMouseDowned =
                d3asEventStream(svgView.d3.brush, "mousedown.epmousedowned")
                .map(true)
                .merge(d3asEventStream(svgView.d3.brush, "mouseup.epmousedowned").map(false))
                .toProperty(false);

        brushMouseDowned
                .takeUntil(svgView.getDestroyES())
                .onValue(svgView, "trigger", "mouse:downed");

        d3asEventStream(svgView.d3.brush, "mousedown.eppreventpanning")
                // prevent panning
                .takeUntil(svgView.getDestroyES())
                .onValue(".stopPropagation");

        svgView.d3.brushFunction(svgView.d3.brush);
    },
    _isZoomMode: function(model) {
        return model.get("interactionMode") === "zoom";
    }
});
