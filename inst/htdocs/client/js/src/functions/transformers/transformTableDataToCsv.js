/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Module returns an async.js-like task function.
 */
define([], function() {
    
    /**
     * 
     * @param {Array} tableData
     * @param {Function} callback Async.js "last argument" callback
     * @returns {undefined}
     */
    return function(tableData, callback) {
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

        callback(null, csv);
    };
    
});