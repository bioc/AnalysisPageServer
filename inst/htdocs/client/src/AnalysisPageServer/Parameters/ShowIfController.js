/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:show.if:initialize", this.initializeShowIfProperty, this);
        app.channel.reply("parameters:show.if:run", this.run, this);
        app.channel.on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:show.if:initialize");
        app.channel.stopReplying("parameters:show.if:run");
        app.channel.off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    hasShowIf: function(parameter) {
        return parameter.get("show.if");
    },
    anyDependencyHasOutdatedValue: function(parameter) {
        return app.channel.request("parameters:has-outdated-value", parameter.getShowIfDependency());
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
