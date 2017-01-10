/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";
import fixedEncodeURIComponent from "functions/fixedEncodeURIComponent";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:display.callback:initialize", this.initializeDisplayCallbackProperty, this);
        app.channel.reply("parameters:display.callback:run", this.run, this);
        app.channel.on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:display.callback:initialize");
        app.channel.stopReplying("parameters:display.callback:run");
        app.channel.off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    hasDisplayCallback: function(parameter) {
        return parameter.get("display.callback");
    },
    anyDependencyHasOutdatedValue: function(parameter) {
        return _.some(parameter.getDisplayCallbackDependencies(), function(depParam) {
            return app.channel.request("parameters:has-outdated-value", depParam);
        }, this);
    },
    onDependencyChangedValue: function(parameter) {
        this.run(parameter);
    },
    run: function(parameter) {
        if (! this.hasDisplayCallback(parameter)) return;
        if (this.anyDependencyHasOutdatedValue(parameter)) return;
        parameter._displayCallbackBus.push(this._buildDisplayCallbackUrl(parameter));
    },
    initializeDisplayCallbackProperty: function(parameter) {
        var dc = parameter.get("display.callback");
        if (this.hasDisplayCallback(parameter)) {
            parameter._displayCallbackBus = new Bacon.Bus();
            parameter.displayCallbackProperty =
                parameter._displayCallbackBus
                    .takeUntil(parameter.getDestroyES())
                    .slidingWindow(2, 1)
                    .filter(this, "_filterDisplayCallbackUrl")
                    .debounce(dc.delay || 0)
                    .flatMapLatest(this, "_mapDisplayCallbackUrlToRequest")
                    .mapError(this, "_mapRequestError")
                    .toProperty();
        }
        else {
            parameter.displayCallbackProperty = Bacon.constant(true);
        }
    },
    _mapRequestError: function(error) {
        return false;
    },
    _buildDisplayCallbackUrl: function(parameter) {
        var dc = parameter.get("display.callback");
        var dependentByName = _.invert(dc.dependent);
        var uri = dc.uri;
        return _.reduce(parameter.getDisplayCallbackDependencies(), function(builtUrl, depModel) {
            return builtUrl.replace(
                        ":"+dependentByName[depModel.get("name")],
                        fixedEncodeURIComponent(depModel.getValue())
                                );
        }, uri, this);
    },
    _filterDisplayCallbackUrl: function(tuple) {
        // if there is no previous url then pass this through
        if (_.size(tuple) === 1) return true;
        // otherwise ony pass url that is different than prev
        return tuple[0] !== tuple[1];
    },
    _mapDisplayCallbackUrlToRequest: function(tuple) {
        return Bacon.fromPromise(Backbone.ajax({
            url: tuple[1] || tuple[0],
            dataType: "json"
        }), true);
    }
});
