/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["async", "functions/transformers/transformCanvasToBlob",
    "functions/transformers/transformSvgToCanvas",
    "FileSaver"], 
function(async,
transformCanvasToBlob, transformSvgToCanvas) {
    
    return function(plotView, filename, callback) {
        var getPng = async.compose(
                transformCanvasToBlob,
                _.partial(transformSvgToCanvas, plotView.$("svg").get(0))
                        );
                        
        getPng(function(err, pngBlob) {
            saveAs(pngBlob, filename);
            callback && callback();
        });
    };
    
});