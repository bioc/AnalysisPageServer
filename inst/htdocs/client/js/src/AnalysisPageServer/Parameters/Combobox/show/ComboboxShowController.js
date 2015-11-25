/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "./itemview/ComboboxParameterView"], 
function(Marionette, Bacon, ComboboxParameterView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("parameters:views:combobox:class", this.getViewForModel, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        createView: function(parameterModel) {
            
        },
        getViewForModel: function(parameterModel) {
            return ComboboxParameterView;
        }
    });
});