/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("app:model:initialize", this.initializeModel, this);
        app.channel.reply("app:model:set-mode", this.setMode, this);
        app.channel.reply("app:model:mode", this.getMode, this);
        app.channel.reply("app:model:env", this.getEnv, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("app:model:initialize");
        app.channel.stopReplying("app:model:set-mode");
        app.channel.stopReplying("app:model:mode");
        app.channel.stopReplying("app:model:env");
    },
    initializeModel: function(appModel) {
        this.appModel = appModel;
    },
    setMode: function(mode) {
        this.appModel.setMode(mode);
        app.channel.trigger("app:model:change-mode", this.appModel, mode);
    },
    getMode: function() {
        return this.appModel.get("mode");
    },
    getEnv: function() {
        return this.appModel.get("env");
    }
});
