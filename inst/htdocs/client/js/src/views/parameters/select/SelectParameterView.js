/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "views/parameters/ParameterView", "TemplateManager"], 
function(Bacon, ParameterView, TemplateManager) {
    var SelectParameterView = ParameterView.extend({

        initialize: function() {
            ParameterView.prototype.initialize.apply(this, arguments);
            var focusES = this.$el.asEventStream("focus", "input");
            focusES
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onFocus");
            var changeValueE = this.model.asEventStream("change:value");
            changeValueE
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onModelChangeValue");
        },
        
        _prepareChoices: function() {
            var choices = this.model.get("choices"), viewChoices = [];
            for (var key in choices) {
                viewChoices.push({
                    value:      key,
                    label:      choices[key],
                    selected:   this.model.get("value") == key
                });
            }
            return viewChoices;
        },
        
        _setModelValue: function(val) {
            this.model.set("value", val, {viewTriggered: true});
        },
        
        onModelChangeValue:  function(model, value) {
            
        },
        
        onFocus:    function() {
            this.fadeIn();
        }
    });
    return SelectParameterView;
});