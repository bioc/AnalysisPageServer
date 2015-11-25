/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"], 
function(Marionette, Bacon) {
    return Marionette.ItemView.extend({

        className: "control-group",

        modelEvents: {
            "change:value": "_onModelChangeValue"
        },

        initialize: function() {

        },

        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },

        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        
        templateHelpers: function() {
            return this.getReqRes().request("parameters:views:template-helpers", this);
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
            this.model.setValue(val, {viewTriggered: true});
        },
        
        _onModelChangeValue: function() {
            
        }
    });
});