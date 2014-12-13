/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Module returns an async.js-like task function.
 */
define(["canvas-toBlob"], function() {
    
    /**
     * @param {Function} callback Async.js "last argument" callback
     * @returns {undefined}
     */
    return function(canvas, callback) {
        canvas.toBlob(function(blob) {
            callback(null, blob);
        });
    };
    
});