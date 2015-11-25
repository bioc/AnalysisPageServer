/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "bootstrap", "velocity.ui"], 
    function(Marionette, Bacon) {
        
    return Marionette.CompositeView.extend({
        getTemplate: function() {
            if (this.getOption("type") === "primary") {
                return "#ep-analysis-primary-form-tmpl";
            }
            else if (this.getOption("type") === "landing") {
                return "#ep-analysis-landing-form-tmpl";
            }
            else {
                return "#ep-analysis-secondary-form-tmpl";
            }
        },
        
        childViewContainer: "[data-parameters-region]",
        
        getChildView: function(childModel) {
            return this.getReqRes().request("parameters:views:class", childModel);
        },
        
        childViewOptions: function(childModel, idx) {
            return _.extend(
                    this.getReqRes().request("parameters:views:options", childModel, this),
                    {
                        
                    }
                    );
        },
        
        ui: {
            submitBtn: "button[type=submit]",
            cancelBtn: "button.ep-form-cancel",
            advToggleBtn: "button.ep-form-advanced-toggle",
            formActions: ".form-actions",
            progressBar: ".form-actions > .progress"
        },
        
        triggers: {
            "submit": "submit",
            "click @ui.cancelBtn": "click:cancel-btn",
            "click @ui.advToggleBtn": "click:advanced-toggle-btn"
        },
        
        initialize: function(opts) {

        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        onRender: function() {
            this.renderAdvancedToggle();
        },
        onDestroy: function() {
            this.ui.advToggleBtn.popover("destroy");
            this.destroyMissingFieldsPopover();
        },
        onShowFully: function() {
            this.children.invoke("triggerMethod", "show:fully");
        },

        getAdvancedToggleTitle: function() {
            var appMode = this.getReqRes().request("app:model:mode");
            return (appMode === "simple" && "Show Advanced Options") || "Hide Advanced Options";
        },
        getAdvancedToggleContent: function() {
            var appMode = this.getReqRes().request("app:model:mode");
            var advParams = new Backbone.Collection(this.model.parameters.getAdvanced());
            var paramLabels = advParams.pluck("label");
            return ((appMode === "simple" && "Click to show: ") || "Click to hide: ")+paramLabels.join(", ");
        },        
        renderAdvancedToggle: function() {
            var appMode = this.getReqRes().request("app:model:mode");
            this.ui.advToggleBtn.popover("destroy");
            this.model.parameters.hasAdvanced() && this.ui.advToggleBtn.removeClass("hide");
            appMode === "advanced" && this.ui.advToggleBtn.addClass("active");
            this.ui.advToggleBtn.popover({
                placement:  "top",
                trigger:    "hover",
                title:      this.getAdvancedToggleTitle(),
                content:    this.getAdvancedToggleContent(),
                container:  "body"
            });
        },
        updateMissingFieldsString: function(unreadyParameters) {
            if (! this.isRendered) return;
            var tempColl = new Backbone.Collection(unreadyParameters);
            var string = tempColl.pluck("label").join(", ");
            this.ui.formActions.attr("data-content", string);
        },
        renderMissingFieldsPopover: function() {
            var self = this;
            this.destroyMissingFieldsPopover();
            this.model.parameters.getUnready()
                    .takeUntil(this.getDestroyES())
                    .onValue(function(unreadyParameters) {
                        if (_.size(unreadyParameters) === 0) return;
                        self.updateMissingFieldsString(unreadyParameters);
                        self.ui.formActions.popover({
                            placement: "top",
                            trigger: "hover",
                            title: "Missing fields:",
                            container: "body"
                        });
                    });
        },
        destroyMissingFieldsPopover: function() {
            this.ui.formActions.popover("destroy");
        },
        enableSubmitButton: function() {
            this.toggleSubmitButton("normal");
            this.toggleSubmitButton("enabled");
        },
        
        toggleSubmitButton: function(state) {
            var $bar;
            switch (state) {
                case "enabled":
                    this.ui.submitBtn.prop("disabled", false);
                    break;
                case "disabled":
                    this.ui.submitBtn.prop("disabled", true);
                    break;
                case "callToAction":
                    this.ui.submitBtn.velocity("callout.pulse");
                    break;
                case "progress":
                    this.ui.progressBar.width(this.ui.submitBtn.outerWidth());
                    this.ui.submitBtn.hide();
                    $bar = this.ui.progressBar.children();
                    var mean = this.model.localModel.get("analysisMeanLoadTime") || 200;
                    $bar.css("transitionDuration", "0ms");
                    $bar.width(0);
                    this.ui.progressBar.show();
                    $bar.css("transitionDuration", mean+"ms");
                    $bar.width("100%");
                    break;
                case "normal":
                    this.ui.submitBtn.show();
                    this.ui.progressBar.hide();
                    $bar = this.ui.progressBar.children();
                    $bar.css("transitionDuration", "0ms");
                    $bar.width(0);
                    break;
            }
            
        }
    });
});