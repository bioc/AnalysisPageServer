/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import PageModel from "./PageModel";
import Bacon from "bacon";
import ParameterCollection from "AnalysisPageServer/Parameters/models/ParameterCollection";
import createClient from "client/createClient";

export default PageModel.extend({
    defaults: {
        label: "",
        plotHeight:     "auto",
        plotZoomable:   true,
        sidebarVisible: true,
        tableVisible:   true,
        tableRows:      30
    },

    initialize(attrs, opts) {
        this.rClient = createClient("R");
        this.restClient = createClient("REST");
        this.parameters = new ParameterCollection(null, {
            pageModel:  this
        });
        PageModel.prototype.initialize.apply(this, arguments);
    },

    isDataset() {
        return this.get("apss");
    },

    saveParameters(parametersJson) {
        this.localModel.set("parameters", parametersJson);
        this.localModel.save();
    },

    abortFetchAnalysis() {
        this.trigger("abort:analysis-request", this);
    },

    initializeParameters() {
        if (!this.isDataset() && this.localModel.get("parameters")) {
            this.parameters.fromJSON(this.localModel.get("parameters"));
        }

        this.parameters.trigger("read-collection-storage");
    }
});
