/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./itemview/SvgView", "polyfills/fullscreen.api"], 
function(Marionette, SvgView, fullscreenApi) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:plot:svg", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getView: function(plotView, settingsModel) {
            var self = this;
            return plotView.model.fetchPlot().then(function(plot) {
                var v = new SvgView({
                    el: "<div>"+plot+"</div>",
                    model: settingsModel,
                    regionClass: "plot-point",
                    pageLabel: plotView.getOption("pageLabel")
                });
                self.initializeShiftKeyPressed(v);
                self.getCommands().execute("analysis-data:views:plot:initialize-point-details", v, plotView.model);
                self.getCommands().execute("analysis-data:views:plot:initialize-zooming", v);
                self.getCommands().execute("analysis-data:views:plot:initialize-brush", v);
                self.getCommands().execute("analysis-data:views:plot:initialize-brush-zooming", v);
                self.getCommands().execute("analysis-data:views:plot:initialize-brush-tagging", v, plotView.model);
                plotView.model.on("filter:complete", function(dataChunk, rowIds) {
                    v.updatePointsDisplay(rowIds);
                });
                plotView.on("emphasize:point", function(pointId) {
                    v.triggerMethod("emphasize:point", pointId);
                });
                plotView.on("deemphasize:point", function(pointId) {
                    v.triggerMethod("deemphasize:point", pointId);
                });
                return v;
            });
        },
        initializeShiftKeyPressed: function(svgView) {
            svgView.shiftKeyPressed = $("body").asEventStream("keydown.shifttest")
                .map(".shiftKey")
                .merge($("body").asEventStream("keyup.shifttest").map(".shiftKey"))
                .skipDuplicates()
                .takeUntil(svgView.getDestroyES())
                .toProperty(false);
        }
        
    });
});