/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
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
        app.channel.stopReplying("pages:collection");
        app.channel.stopReplying("pages:collection:set");
    },
    setPages: function(pages) {
        this.pages = pages;
    },
    getPages: function() {
        return this.pages;
    },
    fetchPages: function() {
        var pages = this.pages;
        return new Promise(function(resolve) {
            if (pages._isFetched) {
                resolve(pages);
            }
            else if (pages._isFetching) {
                pages._fetchPromise.then(function() { resolve(pages); });
            }
            else {
                pages._isFetching = true;
                pages._fetchPromise = Promise.resolve(pages.fetch({
                    remove: false,
                    appModel: pages.appModel
                }))
                        .then(function() {
                            pages._isFetching = false;
                            pages._isFetched = true;
                            resolve(pages);
                        });
            }
        });
    }
});
