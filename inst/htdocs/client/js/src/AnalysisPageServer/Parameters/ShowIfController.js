/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"], function(Marionette, Bacon) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("parameters:show.if:initialize", this.initializeShowIfProperty, this);
            this.getCommands().setHandler("parameters:show.if:run", this.run, this);
            this.getVent().on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
        },
        onDestroy: function() {
            this.getCommands().removeHandler("parameters:show.if:initialize");
            this.getCommands().removeHandler("parameters:show.if:run");
            this.getVent().off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
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
        hasShowIf: function(parameter) {
            return parameter.get("show.if");
        },
        anyDependencyHasOutdatedValue: function(parameter) {
            return this.getReqRes().request("parameters:has-outdated-value", parameter.getShowIfDependency());
        },
        onDependencyChangedValue: function(parameter) {
            this.run(parameter);
        },
        run: function(parameter) {
            if (! this.hasShowIf(parameter)) return;
            if (this.anyDependencyHasOutdatedValue(parameter)) return;
            parameter._showIfBus.push(this.isShownIf(parameter));
        },
        isShownIf: function(parameter) {
            var si = parameter.get("show.if");
            if (! si) return true;
            var fixedValues = _.isArray(si.values) ? si.values : [si.values];
            return _.indexOf(fixedValues, parameter.getShowIfDependency().getValue()) > -1;
        },
        initializeShowIfProperty: function(parameter) {
            if (this.hasShowIf(parameter)) {
                parameter._showIfBus = new Bacon.Bus();
                parameter.showIfProperty = parameter._showIfBus
                        .takeUntil(parameter.getDestroyES())
                        .toProperty();
            }
            else {
                parameter.showIfProperty = Bacon.constant(true);
            }
        }
    });
});