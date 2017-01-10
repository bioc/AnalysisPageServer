/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import Page from "./PageModel";
import AnalysisPage from "./AnalysisPageModel";
import config from "config";
import createClient from "client/createClient";

export default Backbone.Collection.extend({
    url: config["page.collection.url"],

    initialize(models, opts) {
        this.rClient = createClient("R");
        this.appModel = opts.appModel;
        // if this is a collection of dataset page models
        this.parentPageModel = opts.parentPageModel;
    },
    model(attrs, options) {
        // this method is called with differend context!!
        // "this" is  not a collection
        if (!!attrs.hidden && attrs.name !== "IP") {
            return new Page(attrs, options);
        }
        else {
            return new AnalysisPage(attrs, options);
        }
    },
    modelId(attrs) {
        return attrs[Page.prototype.idAttribute];
    },
    /**
     * Allow only for READ operations
     * @param {type} method
     * @returns {@exp;Backbone@pro;sync@call;apply}
     */
    sync(method) {
        if (method === "read") return Backbone.sync.apply(Backbone, arguments);
    },
    fetch(opts) {
        opts.url = this.rClient.url(this.url);
        return Backbone.Collection.prototype.fetch.call(this, opts);
    },

    activePage: null,
    getActive() {
        return this.activePage;
    },
    setActive(page) {
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

    getInMenu() {
        return this.filter(page => page.get("in_menu"));
    }
});
