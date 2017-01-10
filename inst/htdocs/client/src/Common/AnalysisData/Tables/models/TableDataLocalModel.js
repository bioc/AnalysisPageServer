/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import config from "config";
import "backbone.localstorage";

export default Backbone.Model.extend({
    localStorage: () => new Backbone.LocalStorage(config["tableData.model.localStorage"]),
    defaults: {
        plotFetchMeanTime:  5000
    },
    initialize() {
        this.fetch();
    }
});
