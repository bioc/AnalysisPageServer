/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("pages:fetch", this.fetchPages, this);
        app.channel.reply("pages:collection", this.getPages, this);
        app.channel.reply("pages:collection:set", this.setPages, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("pages:fetch");
    },
    setPages: function(pages) {
        this.pages = pages;
    },
    getPages: function() {
        return this.pages;
    },
    fetchPages: function() {
        /*
         * Dataset page model attributes are read either from embedded
         * html elements or query string appended to url.
         *
         * No need for additional GET to rest-endpoint
         */
        return Promise.resolve(this.pages);
    }
});
