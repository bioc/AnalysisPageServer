/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 */
define(["marionette", "bacon", "config", 
    "../Select2ComboboxBehavior", "../../../show/behaviors/ParameterBehavior"], 
function(Marionette, Bacon, config, Select2Behavior, BaseBehavior) {
    
    return Marionette.LayoutView.extend({

        getTemplate: function() {
            if (this.getOption("type") === "landing") {
                return "#ep-form-landing-combobox-tmpl";
            }
            else {
                return "#ep-form-text-tmpl";
            }
        },
        className: "control-group",

        ui: {
            field: "input[type=text]",
            submitBtn: "button[type=submit]"
        },
        
        regions: {
            loader: "[data-loader-region]"
        },

        modelEvents: {
            "fetch:suggestions:start": "onModelFetchSuggestionsStart",
            "fetch:suggestions:success": "onModelFetchSuggestions",
            "fetch:suggestions:fail": "onModelFetchSuggestionsFail"
        },

        behaviors: {
            Select2: {
                behaviorClass: Select2Behavior,
                optionsAttribute: "suggestions"
            },
            Base: {
                behaviorClass: BaseBehavior
            }
        },

        initialize: function() {

        },

        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },

        templateHelpers: function() {
            return this.getReqRes().request("parameters:views:template-helpers", this);
        },
        
        _setModelValue: function(e) {
            this.model.updateFromView(_.pick(e, ["added", "removed", "val"]), {viewTriggered: true});
        },
        
        getDestroyES: function() {
            return this.asEventStream("before:destroy").take(1);
        },
        
        onRender: function() {
//            this.updateSelectionFromModel();
            this._renderLoader();
        },
        
        _renderLoader: function() {
            var v = new Marionette.ItemView({
                template: "#ep-load-indicator-tmpl"
            });
            v.$el.css(this._getLoaderPosition());
            v.$el.css("position", "absolute");
            this.getRegion("loader").show(v);
        },
        
        focus: function() {
//            this.$("#"+this.cid).select2("open");
        },
        
        _getLoaderPosition: function() {
            return {
                top:  this.getOption("type") === "landing" ? "12px" : "3px",
                left: "6px"
            };
        },
        
        enableLoading:  function() {
            this.$el.addClass("ep-loading");
        },
        
        disableLoading:  function() {
            this.$el.removeClass("ep-loading");
        },
        
        onModelFetchSuggestionsStart: function() {
            this.enableLoading();
        },
        onModelFetchSuggestions: function() {
            this.disableLoading();
        },
        onModelFetchSuggestionsFail: function(restClient, jqXHR) {
            this.disableLoading();
            this.getReqRes().request("app:view:show-modal", {
                type: "error",
                fullErrorText: jqXHR.responseText,
                backdrop: false,
                withClose: true,
                title: "Error while populating '"+this.model.get("label")+"' options.",
                doBtnLabel: "Send an email about this?",
                cancelBtnLabel: "Cancel",
                permalink: window.location.origin+config["client.REST.url"]+this.model.get("uri")
            });
        },
        onShowFully: function() {

        }
    });
    
});