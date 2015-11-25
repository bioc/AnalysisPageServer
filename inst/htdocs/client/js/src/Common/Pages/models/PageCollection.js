/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "./PageModel", "./AnalysisPageModel", 
"config", "client/createClient"], 
function(Backbone, Page, AnalysisPage, config, createClient) {
    
    return Backbone.Collection.extend({
        url: config["page.collection.url"],
        
        initialize: function(models, opts) {
            this.rClient = createClient("R");
            this.appModel = opts.appModel;
            // if this is a collection of dataset page models
            this.parentPageModel = opts.parentPageModel;
        },
        model: function(attrs, options) {
            // this method is called with differend context!!
            // "this" is  not a collection
            if (!!attrs.hidden && attrs.name !== "IP") {
                return new Page(attrs, options);
            }
            else {
                return new AnalysisPage(attrs, options);
            }
        },
        modelId: function(attrs) {
            return attrs[Page.prototype.idAttribute];
        },
        /**
         * Allow only for READ operations
         * @param {type} method
         * @returns {@exp;Backbone@pro;sync@call;apply}
         */
        sync: function(method) {
            if (method === "read") return Backbone.sync.apply(Backbone, arguments);
        },
        fetch: function(opts) {
            opts.url = this.rClient.url(this.url);
            return Backbone.Collection.prototype.fetch.call(this, opts);
        },
        
        activePage: null,
        getActive: function() {
            return this.activePage;
        },
        setActive: function(page) {
            if (! page) return;
            if (typeof page === "string") {
                page = this.findWhere({name: page});
            }
            var prev = this.activePage;
            this.activePage = page;
            if (page !== prev) {
                prev && prev.set("active", false);
                page.set("active", true);
                this.trigger("page:activate", prev, page);
            }
        },
        
        getInMenu: function() {
            return this.filter(function(page) {
                return page.get("in_menu");
            });
        }
    });    
});