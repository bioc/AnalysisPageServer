/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("pages:fetch", this.fetchPages, this);
        },
        onDestroy: function() {
            this.getReqRes().removeHandler("pages:fetch");
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        fetchPages: function() {
            var pages = this.getOption("pages");
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
});