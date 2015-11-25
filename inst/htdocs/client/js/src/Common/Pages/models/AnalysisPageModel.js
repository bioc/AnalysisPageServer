/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["./PageModel", "bacon", "AnalysisPageServer/Parameters/models/ParameterCollection",
"client/createClient"],
function(PageModel, Bacon, ParameterCollection, createClient) {

    var AnalysisPageModel = PageModel.extend({
        defaults: {
            label: "",
            sidebarVisible: true,
            tableVisible:   true,
            tableRows:      30
        },

        initialize: function(attrs, opts) {
            this.rClient = createClient("R");
            this.restClient = createClient("REST");
            this.parameters = new ParameterCollection(null, {
                pageModel:  this
            });
            PageModel.prototype.initialize.apply(this, arguments);
        },

        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },

        isDataset: function() {
            return this.get("apss");
        },

        saveParameters: function(parametersJson) {
            this.localModel.set("parameters", parametersJson);
            this.localModel.save();
        },

        abortFetchAnalysis: function() {
            this.trigger("abort:analysis-request");
        },

        initializeParameters: function() {
            if (!this.isDataset() && this.localModel.get("parameters")) {
                this.parameters.fromJSON(this.localModel.get("parameters"));
            }
        }
    });


    return AnalysisPageModel;
});
