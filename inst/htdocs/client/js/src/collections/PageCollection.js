/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "models/PageModel", "models/AnalysisPageModel", "config", "client/createClient"], 
function(Backbone, Page, AnalysisPage, config, createClient) {
    
    var Collection = Backbone.Collection.extend({
        url:            config["page.collection.url"],
        initialize:     function(models, opts) {
            this.rClient = createClient("R");
            this.appModel = opts.appModel;
            // if this is a collection of dataset page models
            this.parentPageModel = opts.parentPageModel;
        },
        model:          function(attrs, options) {
            // this method is called with differend context!!
            // "this" is  not a collection
            if (!!attrs.hidden && attrs.name !== "IP") {
                return new Page(attrs, options);
            }
            else {
                return new AnalysisPage(attrs, options);
            }
        },
        /**
         * Allow only for READ operations
         * @param {type} method
         * @returns {@exp;Backbone@pro;sync@call;apply}
         */
        sync:           function(method) {
            if (method === "read") return Backbone.sync.apply(Backbone, arguments);
        },
        fetch:          function(opts) {
            opts.url = this.rClient.url(this.url);
            return Backbone.Collection.prototype.fetch.call(this, opts);
        },
        activePage:     null,
        getActive:      function() {
            return this.activePage;
        },
        setActive:      function(page) {
            if (typeof page === "string") {
                page = _.find(this.models, function(model) {
                    return model.get("name") == page;
                });
            }
            var prev = this.activePage;
            this.activePage = page;
            if (page !== prev) {
                prev && prev.set("active", false);
                page.set("active", true);
                this.trigger("page:activated", prev, page);
            }
        }
    });
    
    return Collection;
    
});