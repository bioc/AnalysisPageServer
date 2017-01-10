/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:show.if.advanced:initialize", this.initializeAdvancedProperty, this);
        app.channel.reply("parameters:show.if.advanced:run", this.run, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:show.if.advanced:initialize");
        app.channel.stopReplying("parameters:show.if.advanced:run");
    },
    run: function(parameter) {
        parameter._advancedBus.push(this.isShownIfAdvanced(parameter));
    },
    isShownIfAdvanced: function(parameter) {
        var appMode = app.channel.request("app:model:mode");
        return parameter.get("advanced") ? appMode === "advanced" : true;
    },
    initializeAdvancedProperty: function(parameter) {
        var self = this;
        parameter._advancedBus = new Bacon.Bus();
        parameter.advancedProperty = parameter._advancedBus
                .takeUntil(parameter.getDestroyES())
                .toProperty(this.isShownIfAdvanced(parameter));

        parameter.listenTo(app.channel, "app:model:change-mode", function() {
            self.run(parameter);
        });
    }
});
