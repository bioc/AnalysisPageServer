/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("pages:analysis:fetch", this.fetchAnalysis, this);
    },
    onDestroy() {
        app.channel.stopReplying("pages:analysis:fetch");
    },
    fetchAnalysis(pageModel, opts) {
        opts = _.defaults({}, opts, {});
        return new Promise((resolve, reject) => {
            if (pageModel._analysisFetchPromise) {
                pageModel._analysisFetchPromise
                        .then(analysis => resolve(analysis));
            }
            else {
                pageModel._analysisFetchPromise = this._fetchAnalysis(pageModel);
                Promise.resolve(pageModel._analysisFetchPromise)
                        .then(analysis => {
                            delete pageModel._analysisFetchPromise;
                            this._setLabelFromCaption(pageModel, analysis);
                            resolve(analysis);
                        })
                        .catch(e => {
                            delete pageModel._analysisFetchPromise;
                            reject(e.responseText);
                        });
            }
        });
    },
    _abortAnalysisRequest(pageModel) {
        if (pageModel._analysisFetchPromise) {
            pageModel._analysisFetchPromise.abort();
        }
    },
    _fetchAnalysis(pageModel) {
        var parameters = pageModel.parameters;
        if (pageModel.get("data_url")) {
            return parameters.sync("read", parameters, {
                url: pageModel.get("data_url")
            }).then(analysis => {
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
    _setLabelFromCaption(pageModel, analysis) {
        if (! _.isObject(analysis)) return;
        if (analysis.type === "table") {
            pageModel.set("label", analysis.value.caption);
        }
        else if (analysis.type === "plot") {
            pageModel.set("label", analysis.value.table.value.caption);
        }
    }
});
