/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("pages:analysis:fetch", this.fetchAnalysis, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        fetchAnalysis: function(pageModel, opts) {
            var self = this;
            opts = _.defaults({}, opts, {});
            return new Promise(function(resolve, reject) {
                if (pageModel._analysisFetchPromise) {
                    pageModel._analysisFetchPromise
                            .then(function(analysis) {
                                resolve(analysis); 
                            });
                }
                else {
                    pageModel._analysisFetchPromise = self._fetchAnalysis(pageModel);
                    Promise.resolve(pageModel._analysisFetchPromise)
                            .then(function(analysis) {
                                delete pageModel._analysisFetchPromise;
                                self._setLabelFromCaption(pageModel, analysis);
                                resolve(analysis);
                            })
                            .catch(function(e) {
                                delete pageModel._analysisFetchPromise;
                                reject(e.responseText);
                            });
                }
            });
        },
        _abortAnalysisRequest: function(pageModel) {
            if (pageModel._analysisFetchPromise) {
                pageModel._analysisFetchPromise.abort();
            }
        },
        _fetchAnalysis: function(pageModel) {
            var parameters = pageModel.parameters;
            if (pageModel.get("data_url")) {
                return parameters.sync("read", parameters, {
                    url: pageModel.get("data_url")
                }).then(function(analysis) {
                    if (pageModel.get("plot_url") && analysis.type === "plot") {// use it here
                        analysis.value.plot = pageModel.get("plot_url");
                    }
                    return analysis;
                });
            }
            else {// there might be a chance only plot_url was provided
                return Promise.resolve({
                    type:   "plot",
                    label:  "Fake Plot Dataset Response - no 'data_url' provided.",
                    value:  {
                        plot: pageModel.get("plot_url"),
                        table:  {
                            type: "table",
                            value: {}
                        }
                    }
                });
            }
        },
        _setLabelFromCaption: function(pageModel, analysis) {
            if (! _.isObject(analysis)) return;
            if (analysis.type === "table") {
                pageModel.set("label", analysis.value.caption);
            }
            else if (analysis.type === "plot") {
                pageModel.set("label", analysis.value.table.value.caption);
            }
        }
    });
});