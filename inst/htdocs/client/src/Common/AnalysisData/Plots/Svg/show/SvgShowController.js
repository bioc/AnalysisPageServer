/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import Marionette from "marionette";
import app from "app";
import SvgView from "./itemview/SvgView";
import fullscreenApi from "polyfills/fullscreen.api";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:svg", this.getView, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:svg");
    },
    getView(plotView, settingsModel) {
        return plotView.model.fetchPlot().then(plot => {
            let pageModel = plotView.model.pageModel;
            let v = new SvgView({
                el: "<div>"+plot+"</div>",
                model: settingsModel,
                regionClass: "plot-point",
                pageLabel: plotView.getOption("pageLabel"),
                plotHeight: pageModel.get("plotHeight")
            });
            this.initializeShiftKeyPressed(v);
            app.channel.request("analysis-data:views:plot:initialize-point-details", v, plotView.model);
            app.channel.request("analysis-data:views:plot:initialize-brush", v);
            if (pageModel.get("plotZoomable")) {
                app.channel.request("analysis-data:views:plot:initialize-zooming", v);
                app.channel.request("analysis-data:views:plot:initialize-brush-zooming", v);
            }
            app.channel.request("analysis-data:views:plot:initialize-brush-tagging", v, plotView.model);
            v.listenTo(plotView.model, "filter:complete", (dataChunk, rowIds) => {
                v.updatePointsDisplay(rowIds);
            });
            plotView.on("emphasize:point", pointId => {
                v.triggerMethod("emphasize:point", pointId);
            });
            plotView.on("deemphasize:point", pointId => {
                v.triggerMethod("deemphasize:point", pointId);
            });
            return v;
        });
    },
    initializeShiftKeyPressed(svgView) {
        svgView.shiftKeyPressed = $("body").asEventStream("keydown.shifttest")
            .map(".shiftKey")
            .merge($("body").asEventStream("keyup.shifttest").map(".shiftKey"))
            .skipDuplicates()
            .takeUntil(svgView.getDestroyES())
            .toProperty(false);
    }

});
