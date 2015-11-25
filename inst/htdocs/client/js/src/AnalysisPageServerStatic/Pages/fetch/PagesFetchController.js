/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("pages:fetch", this.fetchPages, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        fetchPages: function() {
            /*
             * Dataset page model attributes are read either from embedded
             * html elements or query string appended to url.
             * 
             * No need for additional GET to rest-endpoint
             */
            return Promise.resolve(this.getOption("pages"));
        }
    });
});