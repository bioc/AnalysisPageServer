/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], 
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("app:model:initialize", this.initializeModel, this);
            this.getCommands().setHandler("app:model:set-mode", this.setMode, this);
            this.getReqRes().setHandler("app:model:mode", this.getMode, this);
            this.getReqRes().setHandler("app:model:env", this.getEnv, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getVent: function() {
            return Backbone.Wreqr.radio.channel("global").vent;
        },
        initializeModel: function(appModel) {
            this.appModel = appModel;
        },
        setMode: function(mode) {
            this.appModel.setMode(mode);
            this.getVent().trigger("app:model:change-mode", this.appModel, mode);
        },
        getMode: function() {
            return this.appModel.get("mode");
        },
        getEnv: function() {
            return this.appModel.get("env");
        }
    });
});