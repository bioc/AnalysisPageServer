/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["./SelectParameterView", "../../../show/behaviors/ParameterBehavior", 
    "bacon.jquery"], 
    function(ParentView, BaseBehavior, bjq) {
    return ParentView.extend({
        
        template: "#ep-form-select-radio-tmpl",
        
        ui: {
            fields: "[type=radio]"
        },
        
        behaviors: {
            Base: {
                behaviorClass: BaseBehavior
            }
        },
        
        initialize: function() {
            ParentView.prototype.initialize.apply(this, arguments);
        },
        
        initializeDomEventStreams: function() {
            var actualValueProp = bjq.radioGroupValue(this.ui.fields);
            actualValueProp
                    .takeUntil(this.getDestroyES())
                    .onValue(this, "_setModelValue");
        },
        
        onRender: function() {
            this.initializeDomEventStreams();
        },
        
        _onModelChangeValue: function(model) {
            var $field = this.ui.fields.filter(function() {
                return $(this).val() == model.get("value");
            });
            $field.prop("checked", true);
        }
    });
});