/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import config from "config";
import AnalyticsFacade from "analytics/AnalyticsFacade";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("pages:analysis:fetch", this.fetchAnalysis, this);
    },
    onDestroy() {
        app.channel.stopReplying("pages:analysis:fetch");
    },
    fetchAnalysis(pageModel, opts) {
        opts = _.defaults({}, opts, {
            trackSuccess: true,
            trackFailure: true
        });
        this.listenTo(pageModel, "change:active", this._onModelChangeActive);
        this.listenTo(pageModel, "abort:analysis-request", this._onModelAbortAnalysisRequest);
        pageModel.once("destroy", () => this.stopListening(pageModel));
        return new Promise((resolve, reject) => {
            if (pageModel._analysisFetchPromise) {
                pageModel._analysisFetchPromise
                        .then(analysis => resolve(analysis));
            }
            else {
                var startTime = (new Date()).getTime();
                this._getParametersJson(pageModel)
                    .then(parametersJson => this._fetchAnalysis(pageModel, parametersJson))
                    .then(analysis => {
                        delete pageModel._analysisFetchPromise;
                        var fetchTime = this._saveTimeToFetch(pageModel, startTime);
                        this._persistParametersJson(pageModel);
                        app.channel.request("pages:parameters:conditional-persistent:update", pageModel);
                        opts.trackSuccess && this._trackSuccess(pageModel, fetchTime);
                        resolve(analysis);
                    })
                    .catch(e => {
                        config["log.debug.messages"]
                            && console.debug("[AnalysisFetchController.fetchAnalysis]", JSON.stringify(e));
                        delete pageModel._analysisFetchPromise;
                        if (e.statusText !== "abort") {
                            opts.trackFailure && this._trackFailure(pageModel, e);
                            reject(e.responseText);
                        }
                    });
            }
        });
    },
    _getParametersJson(pageModel, mode) {
        return app.channel.request("parameters:fetch", pageModel)
                .then(parameters => parameters.conditionalToJSON(mode).toPromise());
    },
    _abortAnalysisRequest(pageModel) {
        if (pageModel._analysisFetchPromise) {
            pageModel._analysisFetchPromise.abort();
        }
    },
    _fetchAnalysis(pageModel, parametersJson) {
        var parameters = pageModel.parameters;
        pageModel._analysisFetchPromise = parameters.sync("create", parameters, {
            url:    pageModel.rClient.url("analysis"),
            data:   pageModel.rClient.decoratePostParams(parametersJson, pageModel.get("name"), parameters.getFiles()),
            processData: false,
            contentType: false
        });
        return pageModel._analysisFetchPromise;
    },
    _saveTimeToFetch(pageModel, startTime) {
        var endTime = (new Date()).getTime();
        var time = endTime-startTime;
        pageModel.localModel.setAnalysisMeanLoadTime(time);
        return time;
    },
    _persistParametersJson(pageModel) {
        this._getParametersJson(pageModel, "url").then(json => pageModel.saveParameters(json));
    },
    _trackSuccess(pageModel, time) {
        this._getParametersJson(pageModel).then(json => {
            var studyModel = pageModel.parameters.findWhere({name: "study"});
            AnalyticsFacade.trackEvent(
                pageModel.get("label"),
                studyModel ? studyModel.get("readable")+" - Success" : "Success",
                JSON.stringify(json),
                time
            );
        });
    },
    _trackFailure(pageModel, jqXHR) {
        var studyModel = pageModel.parameters.findWhere({name: "study"});
        if (_.indexOf(["abort", "aborted"], jqXHR.textStatus) === -1) {
            AnalyticsFacade.trackEvent(
                pageModel.get("label"),
                studyModel ? studyModel.get("readable")+" - Failed" : "Failed",
                jqXHR.responseText);
        }
    },
    _onModelChangeActive(pageModel, isActive) {
        if (! isActive) {
            this._abortAnalysisRequest(pageModel);
        }
    },
    _onModelAbortAnalysisRequest(pageModel) {
        this._abortAnalysisRequest(pageModel);
    }
});
