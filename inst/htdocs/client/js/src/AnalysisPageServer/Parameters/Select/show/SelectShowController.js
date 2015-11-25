/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./itemview/getSelectParameterView"], 
function(Marionette, getSelectParameterView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("parameters:views:select:class", this.getViewForModel, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getViewForModel: function(parameterModel) {
            return getSelectParameterView({
                        model: parameterModel
                    });
        }
    });
});