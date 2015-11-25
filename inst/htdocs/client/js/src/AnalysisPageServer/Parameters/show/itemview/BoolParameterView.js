/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/ParameterBehavior"], 
function(Marionette, BaseBehavior) {
    return Marionette.ItemView.extend({
        template: "#ep-form-bool-tmpl",
        className: "control-group",
        
        ui: {
            button: "button"
        },
        
        events: {
            "click @ui.button":     "_onClick"
        },
        
        modelEvents: {
            "change:value": "_onModelChangeValue"
        },
        
        behaviors: {
            Base: {
                behaviorClass: BaseBehavior
            }
        },
        
        templateHelpers: function() {
            var defaults = this.getReqRes().request("parameters:views:template-helpers", this);
            return _.extend(defaults, {
                active: this.model.getValue() === true,
                buttonLabel: this.model.getValue() ? "ON" : "OFF",
                buttonClass: ""
            });
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        focus:  function() {
            this.ui.button.focus();
        },
        
        _onClick:    function(e) {
            this.model.setValue(! this.model.getValue());
        },
        _onModelChangeValue: function(model, isActive) {
            this.ui.button.text(isActive ? "ON" : "OFF");
            this.ui.button[isActive ? "addClass" : "removeClass"]("active");
        }
    });
});