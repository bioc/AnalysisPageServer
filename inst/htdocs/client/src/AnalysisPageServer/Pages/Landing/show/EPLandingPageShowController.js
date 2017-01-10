/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import LandingPageView from "./layoutview/EPLandingPageView";
import AnalyticsFacade from "analytics/AnalyticsFacade";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("app:view:show-main:landing-page", this.onCommandShow, this);
    },
    onDestroy() {
        app.channel.stopReplying("app:view:show-main:landing-page");
    },
    onCommandShow() {
        Backbone.history.navigate("");
        this._show();
    },
    show() {
        this._show();
    },
    _show() {
        var pages = app.channel.request("pages:collection");
        var pageModel = pages.get("landing");
        pages.setActive(pageModel);
        AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
        var v = new LandingPageView({
            model: pageModel
        });
        var promise = app.channel.request("app:view:show-main", v, pageModel.get("label"));
        promise.then(() => {
            this._showStudyForm(v);
            this._showProjectsTable(v);
            app.channel.request("pages:views:landing:tool-overview:initialize", v);
        });
    },
    _showStudyForm(pageView) {
        var pages = app.channel.request("pages:collection");
        var promise = app.channel.request("pages:fetch");
        promise
        .then(() => app.channel.request("parameters:fetch", pages.get("study.summary")))
        .then(() => {
            // user might have changed the page during request
            if (pages.getActive() !== pages.get("landing")) return;
            var formView = app.channel.request("parameters:views:form", {
                model: pages.get("study.summary"),
                collection: pages.get("study.summary").rootParameters,
                type: "landing"
            });
            app.channel.request("parameters:views:form:listen-to", formView);
            app.channel.request("parameters:views:form:landing:initialize", formView);
            pageView.getRegion("studyForm").show(formView);
        });
    },
    _showProjectsTable(pageView) {
        var pages = app.channel.request("pages:collection");
        var promise = app.channel.request("pages:fetch");
        promise
        .then(() => {
            if (pages.get("projects.table").cachedAnalysis) {
                return Promise.resolve(pages.get("projects.table").cachedAnalysis);
            }
            else {
                return app.channel.request("pages:analysis:fetch", pages.get("projects.table"));
            }
        })
        .then(analysis => {
            pages.get("projects.table").cachedAnalysis = analysis;
            // user might have changed the page during request
            if (pages.getActive() === pages.get("landing")) {
                var tableView = app.channel.request("analysis-data:views:table", analysis, {
                    pageModel: pages.get("projects.table")
                });
                pageView.getRegion("projectsTable").show(tableView);
            }

        });
    }
});
