/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./itemview/SideMenuView"], 
function(Marionette, SideMenuView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:plot:menu", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getView: function(plotView, settingsModel) {
            var v = new SideMenuView({
                model: settingsModel
            });
            this.getCommands().execute("analysis-data:table:initialize-save-as", plotView.model, v);
            return v;
        },
        _onViewRender: function(menuView) {
            
        }
    });
});