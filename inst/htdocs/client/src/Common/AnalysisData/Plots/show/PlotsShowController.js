/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import TableDataModel from "Common/AnalysisData/Tables/models/TableDataModel";
import ProgressBarView from "./itemview/ProgressBarView";
import PlotView from "./layoutview/PlotView";
import "velocity/velocity.ui";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot", this.getView, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot");
    },
    getView(analysis, options) {
        var tableDataModel;
        options = options || {};
        if (! options.tableDataModel) {
            tableDataModel = new TableDataModel({
                perChunk: options.pageModel.get("tableRows"),
                plotFile: analysis.value.plot,
                warnings: analysis.warnings,
                customSections: analysis.custom
            }, {
                pageModel: options.pageModel,
                analysis: analysis.value.table
            });
        }
        else {
            tableDataModel = options.tableDataModel;
        }
        var v = new PlotView({
            model: tableDataModel,
            sidebarVisible: options.pageModel.get("sidebarVisible"),
            tableVisible: options.pageModel.get("tableVisible"),
            pageLabel: options.pageModel.get("label")
        });
        this.listenToOnce(v, "render", this._onViewRender);
        v.once("destroy", () => {
            options.tableDataModel || tableDataModel.stopListening();
            this.stopListening(v);
        });
        return v;
    },
    _onViewRender(plotView) {
        var settingsModel = app.channel.request("analysis-data:models:plot:settings", plotView);
        if (plotView.getOption("tableVisible")) {
            this.renderTableView(plotView);
        }
        this.renderSvgView(plotView, settingsModel);
        if (plotView.getOption("sidebarVisible")) {
            this.renderSidebarView(plotView, settingsModel);
        }
        else {
//                plotView.getRegion("sidebar").$el.remove();
//                plotView.removeRegion("sidebar");
            plotView.ui.main
                    .removeClass("span7").addClass("span12");
        }
    },
    renderTableView(plotView) {
        var v = app.channel.request("analysis-data:views:table", null, {
            tableDataModel: plotView.model
        });
        v.on("tbody:mouseenter:tr", rowId => plotView.triggerMethod("emphasize:point", rowId));
        v.on("tbody:mouseleave:tr", rowId => plotView.triggerMethod("deemphasize:point", rowId));
        plotView.getRegion("table").show(v);
    },
    renderMenuView(plotView, settingsModel) {
        var v = app.channel.request("analysis-data:views:plot:menu", plotView, settingsModel);
        plotView.getRegion("menu").show(v);
        v.$el.velocity("transition.fadeIn");
        return v;
    },
    renderSvgView(plotView, settingsModel) {
        var promise = app.channel.request("analysis-data:views:plot:svg", plotView, settingsModel);
        plotView.getRegion("plot").show(new ProgressBarView({
            duration: plotView.model.localModel.get("plotFetchMeanTime")
        }));
        promise
        .then(svgView => {
            plotView.getRegion("plot").show(svgView);
            settingsModel.setDimensions(svgView.originalWidth, svgView.originalHeight);
            var menuView = this.renderMenuView(plotView, settingsModel);
            app.channel.request("analysis-data:views:plot:svg:initialize-save-as", svgView, menuView);
        })
        .catch(e => plotView.getChildView("plot").setWithError());
    },
    renderSidebarView(plotView, settingsModel) {
        var v = app.channel.request("analysis-data:views:plot:sidebar", plotView, settingsModel);
        plotView.getRegion("sidebar").show(v);
    }
});
