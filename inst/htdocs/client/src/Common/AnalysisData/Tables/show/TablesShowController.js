/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";
import TableDataModel from "Common/AnalysisData/Tables/models/TableDataModel";
import TableView from "./layoutview/TableView";
import FilterView from "./itemview/FilterView";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:table", this.getView, this);
        app.channel.reply("analysis-data:views:table:filter:class", this.getFilterClass, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:table");
        app.channel.stopReplying("analysis-data:views:table:filter:class");
    },
    getFilterClass: function() {
        return FilterView;
    },
    getView: function(analysis, options) {
        var tableDataModel;
        var self = this;
        options = options || {};
        if (! options.tableDataModel) {
            tableDataModel = new TableDataModel({
                perChunk: options.pageModel.get("tableRows")
            }, {
                pageModel: options.pageModel,
                analysis: analysis
            });
        }
        else {
            tableDataModel = options.tableDataModel;
        }
        var v = new TableView({
            model: tableDataModel,
            withPlot: !!options.tableDataModel
        });
        app.channel.request("analysis-data:table:initialize-save-as", tableDataModel, v);
        this.listenToOnce(v, "render", this._onViewRender);
        v.once("destroy", function() {
            options.tableDataModel || tableDataModel.stopListening();
            self.stopListening(v);
        });
        return v;
    },
    _onViewRender: function(tableView) {
        var v1 = app.channel.request("analysis-data:views:table:thead", tableView);
        tableView.getRegion("thead").show(v1);
        var v2 = app.channel.request("analysis-data:views:table:tbody", tableView);
        v1.on("resize:column", function() {
            v2.adjustChunkColumnWidth();
        });
        v2.on("mouseenter:tr", function(rowId) {
            tableView.trigger("tbody:mouseenter:tr", rowId);
        });
        v2.on("mouseleave:tr", function(rowId) {
            tableView.trigger("tbody:mouseleave:tr", rowId);
        });
        v2.on("render:first-chunk", function() {
            v1.adjustWidth();
            v1.enableResizableColumns();
            v2.adjustWidth();
            v2.adjustChunkColumnWidth();
        });
        Bacon.fromEvent(window, "resize")
                .takeUntil(tableView.getDestroyES())
                .debounce(300)
                .onValue(function() {
                    v1.adjustWidth();
                    v1.syncHandleWidths();
                    window.requestAnimationFrame(function() {
                        v2.adjustWidth();
                        v2.adjustChunkColumnWidth();
                    });
                });
        tableView.getRegion("tbody").show(v2);
    }
});
