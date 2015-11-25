/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/EPLandingPageView", "analytics/AnalyticsFacade"], 
function(Marionette, LandingPageView, AnalyticsFacade) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("app:view:show-main:landing-page", this.onCommandShow, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        onCommandShow: function() {
            Backbone.history.navigate("");
            this._show();
        },
        show: function() {
            this._show();
        },
        _show: function() {
            var self = this;
            var pages = this.getReqRes().request("pages:collection");
            var pageModel = pages.get("landing");
            pages.setActive(pageModel);
            AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
            var v = new LandingPageView({
                model: pageModel
            });
            var promise = this.getReqRes().request("app:view:show-main", v, pageModel.get("label"));
            promise.then(function() {
                self._showStudyForm(v);
                self._showProjectsTable(v);
                self.getCommands().execute("pages:views:landing:tool-overview:initialize", v);
            });
        },
        _showStudyForm: function(pageView) {
            var self = this;
            var pages = this.getReqRes().request("pages:collection");
            var promise = this.getReqRes().request("pages:fetch");
            promise.then(function() {
                return self.getReqRes().request("parameters:fetch", pages.get("study.summary"));
            }).then(function() {
                // user might have changed the page during request
                if (pages.getActive() !== pages.get("landing")) return;
                var formView = self.getReqRes().request("parameters:views:form", {
                    model: pages.get("study.summary"),
                    collection: pages.get("study.summary").rootParameters,
                    type: "landing"
                });
                self.getCommands().execute("parameters:views:form:listen-to", formView);
                self.getCommands().execute("parameters:views:form:landing:initialize", formView);
                pageView.getRegion("studyForm").show(formView);
            });
        },
        _showProjectsTable: function(pageView) {
            var self = this;
            var pages = this.getReqRes().request("pages:collection");
            var promise = this.getReqRes().request("pages:fetch");
            promise.then(function() {
                if (pages.get("projects.table").cachedAnalysis) {
                    return Promise.resolve(pages.get("projects.table").cachedAnalysis);
                }
                else {
                    return self.getReqRes().request("pages:analysis:fetch", pages.get("projects.table"));
                }                
            }).then(function(analysis) {
                pages.get("projects.table").cachedAnalysis = analysis;
                // user might have changed the page during request
                if (pages.getActive() === pages.get("landing")) {
                    var tableView = self.getReqRes().request("analysis-data:views:table", analysis, {
                        pageModel: pages.get("projects.table")
                    });
                    pageView.getRegion("projectsTable").show(tableView);
                }
                
            });
        }
    });
});