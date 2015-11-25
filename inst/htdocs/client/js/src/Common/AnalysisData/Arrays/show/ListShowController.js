/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], 
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:array:list:initialize", this.initializeView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        initializeView: function(listView) {
            
            
        }
    });
});