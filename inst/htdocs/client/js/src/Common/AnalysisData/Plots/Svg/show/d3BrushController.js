/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "d3", "d3.bacon"], 
function(Marionette, d3, d3asEventStream) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:plot:initialize-brush", this.initializeBrush, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
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
});