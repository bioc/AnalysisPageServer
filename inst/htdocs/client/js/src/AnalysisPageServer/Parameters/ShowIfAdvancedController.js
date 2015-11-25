/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"], function(Marionette, Bacon) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("parameters:show.if.advanced:initialize", this.initializeAdvancedProperty, this);
            this.getCommands().setHandler("parameters:show.if.advanced:run", this.run, this);
        },
        onDestroy: function() {
            this.getCommands().removeHandler("parameters:show.if.advanced:initialize");
            this.getCommands().removeHandler("parameters:show.if.advanced:run");
        },
        getVent: function() {
            return Backbone.Wreqr.radio.channel("global").vent;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        run: function(parameter) {
            parameter._advancedBus.push(this.isShownIfAdvanced(parameter));
        },
        isShownIfAdvanced: function(parameter) {
            var appMode = this.getReqRes().request("app:model:mode");
            return parameter.get("advanced") ? appMode === "advanced" : true;
        },
        initializeAdvancedProperty: function(parameter) {
            var self = this;
            parameter._advancedBus = new Bacon.Bus();
            parameter.advancedProperty = parameter._advancedBus
                    .takeUntil(parameter.getDestroyES())
                    .toProperty(this.isShownIfAdvanced(parameter));
            
            parameter.listenTo(this.getVent(), "app:model:change-mode", function() {
                self.run(parameter);
            });
        }
    });
});