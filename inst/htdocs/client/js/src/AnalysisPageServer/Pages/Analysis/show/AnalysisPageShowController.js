/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "functions/fixedEncodeURIComponent", "analytics/AnalyticsFacade"], 
function(Marionette, fixedEncodeURIComponent, AnalyticsFacade) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("app:view:show-main:analysis-page", this.onCommandShow, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        onCommandShow: function(pageModel, analysis) {
            this._show(pageModel.get("name"), analysis);
            pageModel.parameters.conditionalToJSON("url")
                    .take(1)
                    .onValue(this, "_navigateToAnalysisPage", pageModel);
        },
        show: function(pageName, paramJsonString) {
            var promise = this.getReqRes().request("pages:fetch");
            var pages = this.getReqRes().request("pages:collection");
            var self = this;
            promise.then(function(pages) {
                return self.getReqRes().request("parameters:fetch", pages.get(pageName));
            }).then(function(parameters) {
                self._readParamJsonString(parameters, paramJsonString);
                self._showParamSummaryModal(pages.get(pageName), parameters);
                return self.getReqRes().request("pages:analysis:fetch", pages.get(pageName));
            })
            .then(_.bind(this._show, this, pageName))
            .then(function() {
                AnalyticsFacade.trackPageview(pages.get(pageName).get("label"), window.location.hash);
            })
            .catch(function(responseText) {
                self.getReqRes().request("app:view:show-modal", {
                    type: "error",
                    title: "Oops, an error occured",
                    doBtnLabel: "Send an email about this?",
                    cancelBtnLabel: "Cancel",
                    fullErrorText: responseText,
                    model: pages.get(pageName),
                    permalink: window.location.origin + window.location.pathname +
                            "#page/"+encodeURIComponent(pageName)+"/analysis/" +
                            encodeURIComponent(paramJsonString)
                });
            });
        },
        _showParamSummaryModal: function(page, parameters) {
            var self = this;
            var v = this.getReqRes().request("parameters:views:summary", parameters, false);
            v.$el.addClass("light-blue");
            var modalView = this.getReqRes().request("app:view:show-modal", {
                type: "normal",
                innerView: v,
                title: "Initializing "+page.get("label")+" Page...",
                cancelBtnLabel: "Go to Landing Page instead",
                altBtnLabel: "Modify Parameters",
                progressBar: page.localModel.get("analysisMeanLoadTime")
            });
            modalView.once("do:cancel:action", function() {
                page.trigger("abort:analysis-request", page);
                self.getCommands().execute("app:view:show-main:landing-page", page.collection.get("landing"));
            });
            modalView.once("do:alt:action", function() {
                page.trigger("abort:analysis-request", page);
                self.getCommands().execute("app:view:show-main:primary-page", page);
            });
        },
        _readParamJsonString: function(parameters, paramJsonString) {
            if (paramJsonString) {
                // I need to know if there are any advanced parameters in the URL;
                // this acts like a trigger to switch appModel mode between simple/advanced
                var nbEncounteredAdvanced = 0;
                this.listenTo(parameters, "parameter:value:from:json", function(parameterModel) {
                    if (parameterModel.get("advanced") || parameterModel.anyParentIsAdvanced()) {
                        nbEncounteredAdvanced++;
                    }
                });
                parameters.fromJSON(JSON.parse(paramJsonString));
                
                this.stopListening(parameters, "parameter:value:from:json");

                this.getCommands().execute("app:model:set-mode", nbEncounteredAdvanced > 0 ? "advanced" : "simple");
            }
        },
        _show: function(pageName, analysis) {
            var pages = this.getReqRes().request("pages:collection");
            var pageModel = pages.get(pageName);
            pages.setActive(pageModel);
            var v = this.getReqRes().request("analysis-data:views:"+analysis.type, analysis, {
                isRoot: true,
                pageModel: pageModel
            });
            this.getCommands().execute("app:view:hide-modal");
            var promise = this.getReqRes().request("app:view:show-main", v, pageModel.get("label"));
            promise.then(function() {
                
            });
        },
        _navigateToAnalysisPage: function(pageModel, parametersJson) {
            Backbone.history.navigate("page/"+fixedEncodeURIComponent(pageModel.get("name"))+"/analysis/"+fixedEncodeURIComponent(JSON.stringify(parametersJson)));
            AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
        }
        
    });
});