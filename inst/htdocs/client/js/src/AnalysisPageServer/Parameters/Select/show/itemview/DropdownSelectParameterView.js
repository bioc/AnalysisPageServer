/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["./SelectParameterView", "../Select2SelectBehavior", 
    "../../../show/behaviors/ParameterBehavior"], 
    function(ParentView, Select2Behavior, BaseBehavior) {
    return ParentView.extend({

        template: "#ep-form-text-tmpl",

        ui: {
            field: "input"
        },

        behaviors: {
            Select2: {
                behaviorClass: Select2Behavior,
                optionsAttribute: "choices"
            },
            Base: {
                behaviorClass: BaseBehavior
            }
        },

        initialize: function() {
            ParentView.prototype.initialize.apply(this, arguments);
        },
        
        _setModelValue: function(e) {
            this.model.setValue(e.val, {viewTriggered: true});
        },

        onShowFully: function() {

        }
    });
});