/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "analytics/AnalyticsFacade"], function(Marionette, AnalyticsFacade) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("pages:analysis:fetch", this.fetchAnalysis, this);
        },
        onDestroy: function() {
            this.getReqRes().removeHandler("pages:analysis:fetch");
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        fetchAnalysis: function(pageModel, opts) {
            var self = this;
            opts = _.defaults({}, opts, {
                trackSuccess: true,
                trackFailure: true
            });
            this.listenTo(pageModel, "change:active", this._onModelChangeActive);
            this.listenTo(pageModel, "abort:analysis-request", this._onModelAbortAnalysisRequest);
            pageModel.once("destroy", function() {
                self.stopListening(pageModel);
            });
            return new Promise(function(resolve, reject) {
                if (pageModel._analysisFetchPromise) {
                    pageModel._analysisFetchPromise
                            .then(function(analysis) {
                                resolve(analysis); 
                            });
                }
                else {
                    var startTime = (new Date()).getTime();
                    self._getParametersJson(pageModel)
                            .then(_.bind(self._fetchAnalysis, self, pageModel))
                            .then(function(analysis) {
                                delete pageModel._analysisFetchPromise;
                                var fetchTime = self._saveTimeToFetch(pageModel, startTime);
                                self._persistParametersJson(pageModel);
                                self.getCommands().execute("pages:parameters:persistent:update", pageModel);
                                self.getCommands().execute("pages:parameters:conditional-persistent:update", pageModel);
                                opts.trackSuccess && self._trackSuccess(pageModel, fetchTime);
                                resolve(analysis);
                            })
                            .catch(function(e) {
                                delete pageModel._analysisFetchPromise;
                                if (e.statusText !== "abort") {
                                    opts.trackFailure && self._trackFailure(pageModel, e);
                                    reject(e.responseText);
                                }
                            });
                }
            });
        },
        _getParametersJson: function(pageModel, mode) {
            return this.getReqRes().request("parameters:fetch", pageModel)
                    .then(function(parameters) {
                        return parameters.conditionalToJSON(mode).toPromise();
                    });
        },
        _abortAnalysisRequest: function(pageModel) {
            if (pageModel._analysisFetchPromise) {
                pageModel._analysisFetchPromise.abort();
            }
        },
        _fetchAnalysis: function(pageModel, parametersJson) {
            var parameters = pageModel.parameters;
            pageModel._analysisFetchPromise = parameters.sync("create", parameters, {
                url:    pageModel.rClient.url("analysis"),
                data:   pageModel.rClient.decoratePostParams(parametersJson, pageModel.get("name"), parameters.getFiles()),
                processData: false,
                contentType: false
            });
            return pageModel._analysisFetchPromise;
        },
        _saveTimeToFetch: function(pageModel, startTime) {
            var endTime = (new Date()).getTime();
            var time = endTime-startTime;
            pageModel.localModel.setAnalysisMeanLoadTime(time);
            return time;
        },
        _persistParametersJson: function(pageModel) {
            this._getParametersJson(pageModel, "url").then(function(json) {
                pageModel.saveParameters(json);
            });
        },
        _trackSuccess: function(pageModel, time) {
            this._getParametersJson(pageModel).then(function(json) {
                var studyModel = pageModel.parameters.findWhere({name: "study"});
                AnalyticsFacade.trackEvent(
                    pageModel.get("label"), 
                    studyModel ? studyModel.get("readable")+" - Success" : "Success",
                    JSON.stringify(json),
                    time
                );
            });
        },
        _trackFailure: function(pageModel, jqXHR) {
            var studyModel = pageModel.parameters.findWhere({name: "study"});
            if (_.indexOf(["abort", "aborted"], jqXHR.textStatus) === -1) {
                AnalyticsFacade.trackEvent(
                    pageModel.get("label"), 
                    studyModel ? studyModel.get("readable")+" - Failed" : "Failed",
                    jqXHR.responseText);
            }
        },
        _onModelChangeActive: function(pageModel, isActive) {
            if (! isActive) {
                this._abortAnalysisRequest(pageModel);
            }
        },
        _onModelAbortAnalysisRequest: function(pageModel) {
            this._abortAnalysisRequest(pageModel);
        }
    });
});