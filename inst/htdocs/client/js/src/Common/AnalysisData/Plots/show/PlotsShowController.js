/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "Common/AnalysisData/Tables/models/TableDataModel",
    "./itemview/ProgressBarView", "./layoutview/PlotView", "velocity.ui"],
    function(Marionette, TableDataModel, ProgressBarView, PlotView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:plot", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getView: function(analysis, options) {
            var tableDataModel;
            var self = this;
            options = options || {};
            if (! options.tableDataModel) {
                tableDataModel = new TableDataModel({
                    perChunk: options.pageModel.get("tableRows"),
                    plotFile: analysis.value.plot,
                    warnings: analysis.warnings
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
            v.once("destroy", function() {
                options.tableDataModel || tableDataModel.stopListening();
                self.stopListening(v);
            });
            return v;
        },
        _onViewRender: function(plotView) {
            var settingsModel = this.getReqRes().request("analysis-data:models:plot:settings", plotView);
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
        renderTableView: function(plotView) {
            var v = this.getReqRes().request("analysis-data:views:table", null, {
                tableDataModel: plotView.model
            });
            v.on("tbody:mouseenter:tr", function(rowId) {
                plotView.triggerMethod("emphasize:point", rowId);
            });
            v.on("tbody:mouseleave:tr", function(rowId) {
                plotView.triggerMethod("deemphasize:point", rowId);
            });
            plotView.getRegion("table").show(v);
        },
        renderMenuView: function(plotView, settingsModel) {
            var v = this.getReqRes().request("analysis-data:views:plot:menu", plotView, settingsModel);
            plotView.getRegion("menu").show(v);
            v.$el.velocity("transition.fadeIn");
            return v;
        },
        renderSvgView: function(plotView, settingsModel) {
            var self = this;
            var promise = this.getReqRes().request("analysis-data:views:plot:svg", plotView, settingsModel);
            plotView.getRegion("plot").show(new ProgressBarView({
                duration: plotView.model.localModel.get("plotFetchMeanTime")
            }));
            promise.then(function(svgView) {
                plotView.getRegion("plot").show(svgView);
                settingsModel.setDimensions(svgView.originalWidth, svgView.originalHeight);
                var menuView = self.renderMenuView(plotView, settingsModel);
                self.getCommands().execute("analysis-data:views:plot:svg:initialize-save-as", svgView, menuView);
            }).catch(function(e) {
                plotView.getChildView("plot").setWithError();
            });
        },
        renderSidebarView: function(plotView, settingsModel) {
            var v = this.getReqRes().request("analysis-data:views:plot:sidebar", plotView, settingsModel);
            plotView.getRegion("sidebar").show(v);
        }
    });
});
