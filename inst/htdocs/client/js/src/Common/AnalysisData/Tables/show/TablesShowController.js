/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "Common/AnalysisData/Tables/models/TableDataModel",
    "./layoutview/TableView", "./itemview/FilterView"],
function(Marionette, Bacon, TableDataModel, TableView, FilterView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:table", this.getView, this);
            this.getReqRes().setHandler("analysis-data:views:table:filter:class", this.getFilterClass, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
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
                    perChunk: options.pageModel.get("tableRows"),
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
            this.getCommands().execute("analysis-data:table:initialize-save-as", tableDataModel, v);
            this.listenToOnce(v, "render", this._onViewRender);
            v.once("destroy", function() {
                options.tableDataModel || tableDataModel.stopListening();
                self.stopListening(v);
            });
            return v;
        },
        _onViewRender: function(tableView) {
            var v1 = this.getReqRes().request("analysis-data:views:table:thead", tableView);
            tableView.getRegion("thead").show(v1);
            var v2 = this.getReqRes().request("analysis-data:views:table:tbody", tableView);
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
});
