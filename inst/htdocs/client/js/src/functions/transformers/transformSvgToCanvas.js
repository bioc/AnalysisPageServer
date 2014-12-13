/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Module returns an async.js-like task function.
 */
define(["canvg.bundle"], function() {
    
    /**
     * @param {Function} callback Async.js "last argument" callback
     * @returns {undefined}
     */
    return function(svgEl, callback) {
        var canvas = document.createElement("canvas");
        $(canvas).css({
            position:   "absolute",
            left:       "-9999px",
            top:        "-9999px"
        }).attr({
            width:  $(svgEl).width(), 
            height: $(svgEl).height()
        });
//        $("body").append(canvas);
        
        var serializedSvg = new XMLSerializer().serializeToString(svgEl);

        /*
         * Safari XMLSerializer DOES cut off namespace prefixes of
         * HREF attributes, as if it tries to be compatible with SVG 2.0
         * @link http://www.w3.org/Graphics/SVG/WG/wiki/Href
         * 
         * so I manually prepend them again so that SVG tags that use
         * these attributes are properly drawn on canvas
         * 
         * Firefox & Chrome XMLSerializers seem to preserve prefixes
         * 
         */
        serializedSvg = serializedSvg
                .replace(/ href=/g, " xlink:href=")
                .replace(" xlink=", " xmlns:xlink=");

        canvg(canvas, serializedSvg, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function() {
            callback(null, canvas);
        } });

    };
    
});