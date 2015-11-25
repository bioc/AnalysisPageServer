/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./compositeview/ParametersSummaryView"], 
function(Marionette, SummaryView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("parameters:views:summary", this.getView, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getView: function(parameters, withModify) {
            var v = new SummaryView({
                withModify: withModify,
                collection: parameters
            });
            return v;
        }
    });
});