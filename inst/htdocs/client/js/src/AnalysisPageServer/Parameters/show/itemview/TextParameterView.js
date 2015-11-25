/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/ParameterBehavior"], 
function(Marionette, BaseBehavior) {
    return Marionette.ItemView.extend({
        template: "#ep-form-text-tmpl",
        className: "control-group",
        
        ui: {
            field: "input"
        },
        
        events: {
            "keyup input":     "onKeyup"
        },
        
        modelEvents: {
            "change:value": "onModelChangeValue"
        },
        
        templateHelpers: function() {
            return this.getReqRes().request("parameters:views:template-helpers", this);
        },
        
        behaviors: {
            Base: {
                behaviorClass: BaseBehavior
            }
        },
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        
        focus:  function() {
            this.ui.field.focus();
        },
                
        onModelChangeValue:  function(model, value, opts) {
            opts.viewTriggered || this.ui.field.val(value);
        },
        
        onKeyup:    function(e) {
            var val = this.ui.field.val();
            if (val == null) this.model.unsetValue();
            else this.model.setValue(val, {viewTriggered: true});
        }
    });
});