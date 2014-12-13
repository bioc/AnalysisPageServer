/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define([], function() {
    
    return function(svgEl, callback) {
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
        serializedSvg = serializedSvg.replace(/ href=/g, " xlink:href=").replace(" xlink=", " xmlns:xlink=");

        callback(null, serializedSvg);
    };
});