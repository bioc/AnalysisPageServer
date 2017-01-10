/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import FormView from "./compositeview/FormView";
import fixedEncodeURIComponent from "functions/fixedEncodeURIComponent";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("parameters:views:form:listen-to", this.listenToView, this);
        app.channel.reply("parameters:views:form", this.createView, this);
    },
    onDestroy() {
        app.channel.stopReplying("parameters:views:form:listen-to");
        app.channel.stopReplying("parameters:views:form");
    },
    createView(opts) {
        return new FormView(opts);
    },
    listenToView(formView) {
        this.listenTo(formView, "submit", this._onSubmit);
        this.listenTo(formView, "click:cancel-btn", this._onClickCancelBtn);
        this.listenTo(formView, "click:advanced-toggle-btn", this._onClickAdvancedToggleBtn);
        this.listenToOnce(formView, "render", this._onRender);
        formView.once("destroy", () => this.stopListening(formView));
    },
    fetchAnalysis(args) {
        var promise = app.channel.request("pages:analysis:fetch", args.model);
        promise
            .then(analysis => this._onModelAnalysisFetched(args, analysis))
            .catch(responseText => this._onModelAnalysisFailed(args.view, responseText));
    },
    _onModelAnalysisFailed(formView, responseText) {
        formView.enableSubmitButton();
        formView.ui.cancelBtn.prop("disabled", true);
        formView.model.parameters.conditionalToJSON("url")
            .toPromise()
            .then(paramJson => {
                app.channel.request("app:view:show-modal", {
                    type: "error",
                    fullErrorText: responseText,
                    model: formView.model,
                    permalink: window.location.origin + window.location.pathname +
                            "#page/"+fixedEncodeURIComponent(formView.model.get("name"))+
                            "/analysis/" +
                            fixedEncodeURIComponent(JSON.stringify(paramJson)),
                    title: "Error while fetching analysis for '"+formView.model.get("label")+"'",
                    doBtnLabel: "Send an email about this?",
                    cancelBtnLabel: "Cancel"
                });
            });
    },

    _onModelAnalysisFetched(args, analysis) {
        app.channel.request("app:view:show-main:analysis-page", args.model, analysis);
    },
    _onRender(formView) {
        formView.renderMissingFieldsPopover();
        formView.model.parameters.isReady()
                .takeUntil(formView.getDestroyES())
                .onValue(this, "_onCollectionIsReady", formView);
        formView.listenTo(app.channel, "app:model:change-mode",
                (appModel, mode) => this._onAppModelChangeMode(formView, appModel, mode));
    },
    _onSubmit(args) {
        args.view.toggleSubmitButton("progress");
        args.view.ui.cancelBtn.prop("disabled", false);
        this.fetchAnalysis(args);
    },
    _onClickCancelBtn(args) {
        args.view.ui.cancelBtn.prop("disabled", true);
        args.view.toggleSubmitButton("enabled");
        args.view.toggleSubmitButton("normal");
        args.model.abortFetchAnalysis();
    },
    _onClickAdvancedToggleBtn() {
        if (app.channel.request("app:model:mode") === "simple")
            app.channel.request("app:model:set-mode", "advanced");
        else
            app.channel.request("app:model:set-mode", "simple");
    },
    _onAppModelChangeMode(formView, appModel, mode) {
        formView.renderAdvancedToggle();
        formView.ui.advToggleBtn[mode === "simple" ? "removeClass" : "addClass"]("active");
    },
    _onCollectionIsReady(formView, parametersReady) {
        if (parametersReady) {
            formView.toggleSubmitButton("enabled");
            formView.toggleSubmitButton("callToAction");
            formView.destroyMissingFieldsPopover();
        }
        else {
            formView.toggleSubmitButton("disabled");
        }
    }
});
