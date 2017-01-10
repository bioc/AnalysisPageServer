/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import config from "config";
import app from "app";
import saveAs from "FileSaver";
import "Blob";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:table:initialize-save-as", this.initializeSaveAs, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:table:initialize-save-as");
    },
    initializeSaveAs: function(tableDataModel, view) {
        this.listenTo(view, "download:csv", args => this._onDownloadCsv(tableDataModel, args));
        view.once("destroy", () => this.stopListening(view));
    },
    startWithHeader: function(pageModel) {
        var csvHeader = [];
        csvHeader.push("# ExpressionPlot "+config.version);
        csvHeader.push("# Data Generated on " + (new Date()).toString());
        csvHeader.push("# Page: " + pageModel.get("label"), "#");
        return Promise.resolve(csvHeader);
    },
    addParameterValues: function(parameterCollection, csv) {
        return new Promise(resolve => {
            parameterCollection.getActive()
                .take(1)
                .map(activeParameters => this._mapActiveToValues(activeParameters))
                .onValue(linesWithValues => resolve(csv.concat(linesWithValues).concat(["#"])));
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
        return csv.concat(tableDataModel.filtersCollection.reduce((memo, filterModel) => {
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
        return tableDataModel.getActiveRows()
                .then(activeRows => csv.concat(this.transformDataToCsv(this.mapRowsToData(activeRows))));
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
        return _.map(result.rows, row => row.data);
    },
    transformTextToBlob: function(csv) {
        return new Blob([csv.join("\n")], {type: "text/csv"});
    },
    _onDownloadCsv: function(tableDataModel, args) {
        args.view.ui.downloadCsvBtn.prop("disabled", true)
                .parent().addClass("disabled");
        this.startWithHeader(tableDataModel.pageModel)
            .then(csv => this.addParameterValues(tableDataModel.pageModel.parameters, csv))
            .then(csv => this.addInfoAboutSelectedRows(tableDataModel, csv))
            .then(csv => this.addInfoAboutFilters(tableDataModel, csv))
            .then(csv => this.addColumnLabels(tableDataModel, csv))
            .then(csv => this.addTableData(tableDataModel, csv))
            .then(csv => {
                var blob = this.transformTextToBlob(csv);
                args.view.ui.downloadCsvBtn.prop("disabled", false)
                        .parent().removeClass("disabled");
                // saveAs(blob, tableDataModel.pageModel.get("label")+".csv");
                if (navigator.userAgent === config["phantomjs.userAgent"]) {
                    window.open(window.URL.createObjectURL(blob));
                }
                else {
                    saveAs(blob, tableDataModel.pageModel.get("label")+".csv");
                }
            });
    }
});
