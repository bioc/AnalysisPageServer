/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import config from "config";
import "backbone.localstorage";

export default Backbone.Model.extend({
    localStorage: () => new Backbone.LocalStorage(config["page.model.localStorage"]),
    defaults: {
        analysisMeanLoadTime: 3000
    },
    initialize() {
        this.fetch();
    },
    setAnalysisMeanLoadTime(newTime) {
        var k = "analysisMeanLoadTime";
        this.set(k, parseInt((parseInt(this.get(k)) + newTime)/2));
    }
});
