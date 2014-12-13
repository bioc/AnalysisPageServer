/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define([], function() {

    /**
     * @constructor
     */
    function Client() {
        
    }
    
    /*
     * inheritable properties
     */
    Client.prototype = {
        url_base:   "",
        host:   "",
        port:   "",
        
        /**
         * 
         * @param {String} resource
         * @param {String} page
         * @param {Object} params
         * @returns {String}
         */
        url:    function(resource, page, params) {
            var url = "";
            if (typeof this.host !== "undefined" && this.host != "") {
                url = "http://" + this.host;
                if(typeof this.port !== "undefined" && this.port != "")  url = url + ":" + this.port;
                url = url + "/";
            }
            if (typeof this.url_base !== "undefined") {
                url = url + (resource.indexOf(this.url_base) == 0 ? "" : this.url_base);
            }
            url += resource;
            if (page || typeof params !== "undefined") {
                url += "?";
            }
            if (page) {
                url += "page=" + encodeURIComponent(page) + ";";
            }

            for(var k in params)  {
                url += k + "=" + encodeURIComponent(params[k]) + ";";
            }
            return url;
        },
        /**
         * @param {Object} params 
         * @returns {Object} The same params parameter with values properly encoded 
         * @link http://stackoverflow.com/questions/8910140/is-there-any-downside-in-setting-a-form-to-multipart-in-html/8910421#8910421
         * @link http://stackoverflow.com/questions/2678551/when-to-encode-space-to-plus-and-when-to-20
         * since jquery.form plugin encodes each request parameter in "application/x-www-urlencoded"
         * spaces are replaced with "+". For the server to know exactly what to
         * decode I can replace every space with "%20" prior to plugin routine
         * @see EXPRESSIONPLOT-113 - comment on 23/Apr/13
         * "%" chars now are URL-encoded too
         */
        encodeParams:   function(params) {
            _.each(params, function(value, key) {
                value = value === void 0 ? String(null) : value.toString();
                params[key] = value
                            .replace(/%/g, "%25")
                            .replace(/ /g, "%20");
            });
            return params;
        },
        /**
         * A checker which implements specific method of examining if body contains
         * an error from the server
         *
         * @param {String} response a response body as returned by AJAX call
         * @returns {Boolean}
         */
        responseIsError: function(response) {

            return String(response).indexOf("ERROR") === 0 ||
                    // this is probably how IE decorates error - I noticed it only there
                    String(response).indexOf("<pre>ERROR") === 0 ||
                    String(response).indexOf("<PRE>ERROR") === 0;
        }
    };
    return Client;
});