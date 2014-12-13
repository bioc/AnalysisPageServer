/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Module returns an async.js-like task function.
 */
define(["Blob"], function() {
    
    /**
     * @param {String} mimeType
     * @param {Array|String} text
     * @param {Function} callback Async.js "last argument" callback
     * @returns {undefined}
     */
    return function(mimeType, text, callback) {
        var blob = new Blob(text, {type: mimeType});
        callback(null, blob);
    };
    
});