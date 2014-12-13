/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["async", "functions/transformers/transformTextToBlob",
    "functions/transformers/transformSvgToText",
    "FileSaver"], 
function(async,
transformTextToBlob, transformSvgToText) {
    
    return function(plotView, filename, callback) {
        var getSvg = async.compose(
                _.partial(transformTextToBlob, "image/svg+xml"),
                function(serializedSvg, cb) {cb(null, ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"+serializedSvg]);},
                _.partial(transformSvgToText, plotView.$("svg").get(0))
                        );
                        
        getSvg(function(err, svgBlob) {
            saveAs(svgBlob, filename);
            callback && callback();
        });
    };
    
});