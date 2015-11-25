/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./compositeview/FormView"], 
function(Marionette, FormView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("parameters:views:form:listen-to", this.listenToView, this);
            this.getReqRes().setHandler("parameters:views:form", this.createView, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getVent: function() {
            return Backbone.Wreqr.radio.channel("global").vent;
        },
        createView: function(opts) {
            return new FormView(opts);
        },
        listenToView: function(formView) {
            var self = this;
            this.listenTo(formView, "submit", this._onSubmit);
            this.listenTo(formView, "click:cancel-btn", this._onClickCancelBtn);
            this.listenTo(formView, "click:advanced-toggle-btn", this._onClickAdvancedToggleBtn);
            this.listenToOnce(formView, "render", this._onRender);
            formView.once("destroy", function() {
                self.stopListening(formView);
            });
        },
        fetchAnalysis: function(args) {
            var promise = this.getReqRes().request("pages:analysis:fetch", args.model);
            promise
                    .then(_.bind(this._onModelAnalysisFetched, this, args))
                    .catch(_.bind(this._onModelAnalysisFailed, this, args.view));
        },
        _onModelAnalysisFailed: function(formView, responseText) {
            formView.enableSubmitButton();
            formView.ui.cancelBtn.prop("disabled", true);
            this.getReqRes().request("app:view:show-modal", {
                type: "error",
                fullErrorText: responseText,
                model: formView.model,
                permalink: "",
                title: "Error while fetching analysis for '"+formView.model.get("label")+"'",
                doBtnLabel: "Send an email about this?",
                cancelBtnLabel: "Cancel"
            });
        },
        
        _onModelAnalysisFetched: function(args, analysis) {
            this.getCommands().execute("app:view:show-main:analysis-page", args.model, analysis);
        },
        _onRender: function(formView) {
            formView.renderMissingFieldsPopover();
            formView.model.parameters.isReady()
                    .takeUntil(formView.getDestroyES())
                    .onValue(this, "_onCollectionIsReady", formView);
            formView.listenTo(this.getVent(), "app:model:change-mode", _.bind(this._onAppModelChangeMode, this, formView));
        },
        _onSubmit: function(args) {
            args.view.toggleSubmitButton("progress");
            args.view.ui.cancelBtn.prop("disabled", false);
            this.fetchAnalysis(args);
        },
        _onClickCancelBtn: function(args) {
            args.view.ui.cancelBtn.prop("disabled", true);
            args.view.toggleSubmitButton("enabled");
            args.view.toggleSubmitButton("normal");
            args.model.abortFetchAnalysis();
        },
        _onClickAdvancedToggleBtn: function() {
            if (this.getReqRes().request("app:model:mode") === "simple")
                this.getCommands().execute("app:model:set-mode", "advanced");
            else
                this.getCommands().execute("app:model:set-mode", "simple");
        },
        _onAppModelChangeMode: function(formView, appModel, mode) {
            formView.renderAdvancedToggle();
            formView.ui.advToggleBtn[mode === "simple" ? "removeClass" : "addClass"]("active");
        },
        _onCollectionIsReady: function(formView, parametersReady) {
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
});