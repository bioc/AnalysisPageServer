/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import fixedEncodeURIComponent from "functions/fixedEncodeURIComponent";
import AnalyticsFacade from "analytics/AnalyticsFacade";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("app:view:show-main:analysis-page", this.onCommandShow, this);
    },
    onDestroy() {
        app.channel.stopReplying("app:view:show-main:analysis-page");
    },
    onCommandShow(pageModel, analysis) {
        this._show(pageModel.get("name"), analysis);
        pageModel.parameters.conditionalToJSON("url")
                .take(1)
                .onValue(this, "_navigateToAnalysisPage", pageModel);
    },
    show(pageName, paramJsonString) {
        var promise = app.channel.request("pages:fetch");
        var pages = app.channel.request("pages:collection");
        promise
        .then(pages => app.channel.request("parameters:fetch", pages.get(pageName)))
        .then(parameters => {
            this._readParamJsonString(parameters, paramJsonString);
            this._showParamSummaryModal(pages.get(pageName), parameters);
            return app.channel.request("pages:analysis:fetch", pages.get(pageName));
        })
        .then(analysis => this._show(pageName, analysis))
        .then(() => AnalyticsFacade.trackPageview(
                        pages.get(pageName).get("label"),
                        window.location.hash)
        )
        .catch(responseText => {
            app.channel.request("app:view:show-modal", {
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
    _showParamSummaryModal(page, parameters) {
        var v = app.channel.request("parameters:views:summary", parameters, false);
        v.$el.addClass("light-blue");
        var modalView = app.channel.request("app:view:show-modal", {
            type: "normal",
            innerView: v,
            title: "Initializing "+page.get("label")+" Page...",
            cancelBtnLabel: "Go to Landing Page instead",
            altBtnLabel: "Modify Parameters",
            progressBar: page.localModel.get("analysisMeanLoadTime")
        });
        modalView.once("do:cancel:action", () => {
            page.trigger("abort:analysis-request", page);
            app.channel.request("app:view:show-main:landing-page", page.collection.get("landing"));
        });
        modalView.once("do:alt:action", () => {
            page.trigger("abort:analysis-request", page);
            app.channel.request("app:view:show-main:primary-page", page);
        });
    },
    _readParamJsonString(parameters, paramJsonString) {
        if (paramJsonString) {
            // I need to know if there are any advanced parameters in the URL;
            // this acts like a trigger to switch appModel mode between simple/advanced
            var nbEncounteredAdvanced = 0;
            this.listenTo(parameters, "parameter:value:from:json", parameterModel => {
                if (parameterModel.get("advanced") || parameterModel.anyParentIsAdvanced()) {
                    nbEncounteredAdvanced++;
                }
            });
            parameters.fromJSON(JSON.parse(paramJsonString));

            this.stopListening(parameters, "parameter:value:from:json");

            app.channel.request("app:model:set-mode", nbEncounteredAdvanced > 0 ? "advanced" : "simple");
        }
    },
    _show(pageName, analysis) {
        var pages = app.channel.request("pages:collection");
        var pageModel = pages.get(pageName);
        pages.setActive(pageModel);
        var v = app.channel.request("analysis-data:views:"+analysis.type, analysis, {
            isRoot: true,
            pageModel
        });
        app.channel.request("app:view:hide-modal");
        var promise = app.channel.request("app:view:show-main", v, pageModel.get("label"));
    },
    _navigateToAnalysisPage(pageModel, parametersJson) {
        Backbone.history.navigate("page/"+fixedEncodeURIComponent(pageModel.get("name"))+"/analysis/"+fixedEncodeURIComponent(JSON.stringify(parametersJson)));
        AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
    }

});
