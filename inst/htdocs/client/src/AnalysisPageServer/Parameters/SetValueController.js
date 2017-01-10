/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("parameters:listen-to-set-value", this.listenToSetValue, this);
        app.channel.reply("parameters:has-outdated-value", this.hasOutdatedValue, this);
    },
    onDestroy() {
        app.channel.stopReplying("parameters:listen-to-set-value");
        app.channel.stopReplying("parameters:has-outdated-value");
    },
    listenToSetValue(parameter) {
        this.listenTo(parameter, "set:value", this._onSetValue);
        parameter.once("destroy", () => this.stopListening(parameter));
    },
    _onSetValue(parameter, value, opts) {
        var valueChanged = parameter.hasChanged("value");// store it early on
        var dependentOn = app.channel.request("parameters:get-dependent-on", parameter);
        valueChanged && this._markDeeplyDependentWithOutdatedValue(dependentOn, parameter);
        parameter.set("_outdatedValue", false);
        valueChanged && this._triggerActionsOnDirectlyDependent(dependentOn, parameter);
    },
    _filterDirectlyDependent(dependentOn, parameter) {
        return _.reduce(dependentOn, (memo, dependentParam) => {
            // exclude triggering parameter (may be the case with self-dependent comboboxes)
            if (dependentParam === parameter) return memo;
            if (_.indexOf(dependentParam.getDependencies(), parameter) > -1) {
                memo.push(dependentParam);
            }
            return memo;
        }, [], this);
    },
    _markDeeplyDependentWithOutdatedValue(dependentOn, parameterWithChangedValue) {
        _.each(this._filterDependentWithOutdatedValue(dependentOn, parameterWithChangedValue), parameter => {
            parameter.set("_outdatedValue", true);
        });
    },
    _filterDependentWithOutdatedValue(dependentOn, parameterWithChangedValue) {
        return _.filter(dependentOn, parameter => {
            return this._testForOutdatedValue(parameter, parameterWithChangedValue);
        }, this);
    },
    hasOutdatedValue(parameter) {
        return parameter.get("_outdatedValue");
    },
    /**
     * A parameter dependent by persistent or combobox dependency
     * on other that changed value HAS outdated value.
     * This may change in the future when features are added/modified.
     */
    _testForOutdatedValue(parameter, parameterWithChangedValue) {
        return _.indexOf(parameter.getPersistentDependencies(), parameterWithChangedValue) > -1 ||
                        (parameter.get("type") === "combobox" && _.indexOf(parameter.getComboboxDependencies(), parameterWithChangedValue) > -1);
    },
    _triggerActionsOnDirectlyDependent(dependentOn, parameterWithChangedValue) {
        var directlyDependent = this._filterDirectlyDependent(dependentOn, parameterWithChangedValue);
        _.each(directlyDependent, dep => {
            this.hasOutdatedValue(dep) && dep.reset();
            app.channel.trigger("parameters:dependency-changed-value", dep);
        }, this);
    }
});
