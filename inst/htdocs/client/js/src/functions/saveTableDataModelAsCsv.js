/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["async", "functions/transformers/transformTextToBlob",
    "functions/transformers/transformTableDataToCsv",
    "functions/decorators/decorateCsv",
    "FileSaver"], 
function(async,
transformTextToBlob, transformTableDataToCsv, decorateCsv) {
    
    function transformWorkerResponse(result, cb) {
        cb(null, _.map(result.rows, function(row) {
            return row.data;
        }));
    }
    
    return function(tableDataModel, filename, callback) {
        var getCsv = async.compose(
                        _.partial(transformTextToBlob, "text/csv"), 
                        function(csvArray, cb) {cb(null, [csvArray.join("\n")]);},
                        _.partial(decorateCsv, tableDataModel.pageModel, tableDataModel), 
                        transformTableDataToCsv, 
                        transformWorkerResponse,
                        _.bind(tableDataModel.getActiveRows, tableDataModel));
                        
        getCsv(function(err, csvBlob) {
            saveAs(csvBlob, filename);
            callback && callback();
        });
    };
    
});