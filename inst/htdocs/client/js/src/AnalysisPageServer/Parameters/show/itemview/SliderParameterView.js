/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "marionette", "../behaviors/ParameterBehavior"], 
function(Bacon, Marionette, BaseBehavior) {
    return Marionette.ItemView.extend({
        template: "#ep-form-slider-tmpl",
        className: "control-group",
        
        ui: {
            field: "input[type=range]",
            label: "label span"
        },
        
        events: {
            "change": "_onChange",
            "input": "_onInput"
        },
        
        modelEvents: {
            "change:value": "_onModelChangeValue"
        },
        
        templateHelpers: function() {
            var defaults = this.getReqRes().request("parameters:views:template-helpers", this);
            return _.extend(defaults, {
                min: this.model.get("min"),
                max: this.model.get("max"),
                step: this.model.get("step")
            });
        },
        
        behaviors: {
            Base: {
                behaviorClass: BaseBehavior
            }
        },
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        
        focus: function() {
            this.ui.field.focus();
        },
        
        _onModelChangeValue:  function(model, value) {
            this.ui.field.val(value);
        },
        _onInput: function() {
            var val = this.ui.field.val();
            this.ui.label.text(val);
        },
        _onChange: function() {
            var val = this.ui.field.val();
            if (val == null) {
                this.model.unsetValue();
            }
            else { 
                this.model.setValue(parseFloat(val), {viewTriggered: true});
            }
        }
    });
});