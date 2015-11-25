/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], 
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:html", this.getView, this);
            this.getReqRes().setHandler("analysis-data:views:simple", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getView: function(analysis) {
            var $el = $("<div></div>");
            $el.html(analysis.value);
            return new Marionette.ItemView({
                template: false,
                el: $el
            });
        }
    });
});