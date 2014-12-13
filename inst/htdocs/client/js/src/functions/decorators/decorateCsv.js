/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "config"], function(Bacon, config) {
    
    function infoOnSelected(tableDataModel) {
        var nbSelected = _.size(tableDataModel.get("selected"));
        return nbSelected ? ["# Filtered "+nbSelected+" points based on user-selected region"] : [];
    }
    
    function infoOnFilters(tableDataModel) {
        var csvFilters = [];
        _.each(tableDataModel.filters, function(filterModel) {
            if (filterModel.has("value")) {
                csvFilters.push("# Filter: "+filterModel.toReadableFormat());
            }
        });
        return csvFilters;
    }
    
//    function infoOnFormValues(parameterCollection) {
//        var csvParamValues = [];
//        parameterCollection.each(function(parameter) {
//            if (parameter.isActive() && ! parameter.isComplex()) {
//                csvParamValues.push("# Parameter "+parameter.get("label")+": "+parameter.get("value"));
//            }
//        });
//        return csvParamValues;
//    }
    
    function mapActiveToValues(activeParameters) {
        return _.map(activeParameters, function(activeParameter, i) {
            if (! activeParameter.isComplex()) {
                var v = activeParameter.get("readable") || activeParameter.get("value");
                return "# Parameter "+activeParameter.get("label")+": "+v;
            }
        });
    }
    
    function infoOnFormValues(parameterCollection) {
        return parameterCollection.getActive()
                .take(1)
                .map(mapActiveToValues);
    }
    
    function finalCallback(csv, callback, csvHeaderArrayOfArrays) {
        var finalCsv = [];
        finalCsv = [].concat.apply(finalCsv, csvHeaderArrayOfArrays);
        finalCsv = finalCsv.concat(csv);
        callback(null, finalCsv);
    }
    
    /**
     * 
     * @param {PageModel} page
     * @param {TableDataModel} tableDataModel
     * @param {Array} csv
     * @param {Function} callback Async.js "last argument" callback
     * @returns {undefined}
     */
    return function(page, tableDataModel, csv, callback) {
        var csvHeader = [];
        csvHeader.push("# ExpressionPlot "+config.version);
        csvHeader.push("# Data Generated on " + (new Date()).toString());
        
        csvHeader.push("# Page: " + page.get("label"), "#");

        var columnLabelLine = _.map(tableDataModel.get("meta"), function(colMeta) {
            return colMeta.label;
        });
        
        Bacon.combineAsArray(
                csvHeader, 
                infoOnFormValues(page.parameters),
                ["#"],
                infoOnSelected(tableDataModel), 
                infoOnFilters(tableDataModel),
                ["#"],
                [columnLabelLine.join(",")]
                        )
                        .take(1)
                        .onValue(finalCallback, csv, callback);

    };
    
});