/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "config", "FileSaver", "Blob"],
function(Marionette, config) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:table:initialize-save-as", this.initializeSaveAs, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        initializeSaveAs: function(tableDataModel, view) {
            var self = this;
            this.listenTo(view, "download:csv", _.partial(this._onDownloadCsv, tableDataModel));
            view.once("destroy", function() {
                self.stopListening(view);
            });
        },
        startWithHeader: function(pageModel) {
            var csvHeader = [];
            csvHeader.push("# ExpressionPlot "+config.version);
            csvHeader.push("# Data Generated on " + (new Date()).toString());
            csvHeader.push("# Page: " + pageModel.get("label"), "#");
            return new Promise(function(resolve) {
                resolve(csvHeader);
            });
        },
        addParameterValues: function(parameterCollection, csv) {
            var self = this;
            return new Promise(function(resolve) {
                parameterCollection.getActive()
                    .take(1)
                    .map(_.bind(self._mapActiveToValues, self))
                    .onValue(function(linesWithValues) {
                        resolve(csv.concat(linesWithValues).concat(["#"]));
                    });
            });
        },
        _mapActiveToValues: function(activeParameters) {
            return _.reduce(activeParameters, function(memo, activeParameter, i) {
                if (! activeParameter.isComplex()) {
                    var v = activeParameter.get("readable") || activeParameter.get("value");
                    memo.push("# Parameter "+activeParameter.get("label")+": "+v);
                }
                return memo;
            }, []);
        },
        addInfoAboutSelectedRows: function(tableDataModel, csv) {
            var nbSelected = _.size(tableDataModel.get("selected"));
            if (nbSelected) {
                return csv.concat(["# Filtered "+nbSelected+" points based on user-selected region"]);
            }
            else {
                return csv;
            }
        },
        addInfoAboutFilters: function(tableDataModel, csv) {
            return csv.concat(tableDataModel.filtersCollection.reduce(function(memo, filterModel) {
                if (filterModel.has("value")) {
                    memo.push("# Filter: "+filterModel.toReadableFormat());
                }
                return memo;
            }, [])).concat(["#"]);
        },
        addColumnLabels: function(tableDataModel, csv) {
            return csv.concat([tableDataModel.metaCollection.pluck("label").join(",")]);
        },
        addTableData: function(tableDataModel, csv) {
            var self = this;
            return tableDataModel.getActiveRows()
                    .then(function(activeRows) {
                        return csv.concat(self.transformDataToCsv(self.mapRowsToData(activeRows)));
                    });
        },
        transformDataToCsv: function(tableData) {
            var csv = [];
            var tempElement = document.createElement("div");
            _.each(tableData, function(row) {
                var rowJoined = "";
                _.each(row, function(cell) {
                    /*
                     * @see EXPRESSIONPLOT-208
                     */
                    var strippedCell = $(tempElement).html(String(cell)).text();
                    rowJoined += ",\"" + strippedCell + "\"";
                });
                csv.push(rowJoined.substring(1));
            });
            return csv;
        },
        mapRowsToData: function(result) {
            return _.map(result.rows, function(row) {
                return row.data;
            });
        },
        transformTextToBlob: function(csv) {
            return new Blob([csv.join("\n")], {type: "text/csv"});
        },
        _onDownloadCsv: function(tableDataModel, args) {
            var self = this;
            args.view.ui.downloadCsvBtn.prop("disabled", true)
                    .parent().addClass("disabled");
            this.startWithHeader(tableDataModel.pageModel)
                    .then(_.bind(this.addParameterValues, this, tableDataModel.pageModel.parameters))
                    .then(_.bind(this.addInfoAboutSelectedRows, this, tableDataModel))
                    .then(_.bind(this.addInfoAboutFilters, this, tableDataModel))
                    .then(_.bind(this.addColumnLabels, this, tableDataModel))
                    .then(_.bind(this.addTableData, this, tableDataModel))
                    .then(function(csv) {
                        var blob = self.transformTextToBlob(csv);
                        args.view.ui.downloadCsvBtn.prop("disabled", false)
                                .parent().removeClass("disabled");
                        saveAs(blob, tableDataModel.pageModel.get("label")+".csv");
                    });
        }
    });
});
