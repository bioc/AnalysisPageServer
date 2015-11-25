/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("parameters:listen-to-set-value", this.listenToSetValue, this);
            this.getReqRes().setHandler("parameters:has-outdated-value", this.hasOutdatedValue, this);
            this.getVent().on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
        },
        onDestroy: function() {
            this.getCommands().removeHandler("parameters:listen-to-set-value");
            this.getReqRes().removeHandler("parameters:has-outdated-value");
            this.getVent().off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
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
        onDependencyChangedValue: function(parameter, opts) {
            parameter.reset();
        },
        listenToSetValue: function(parameter) {
            var self = this;
            this.listenTo(parameter, "change:value", this._onSetValue);
            parameter.once("destroy", function() {
                self.stopListening(parameter);
            });
        },
        _onSetValue: function(parameter, value, opts) {
            var dependentOn = this.getReqRes().request("parameters:get-dependent-on", parameter);
            this._markDeeplyDependentWithOutdatedValue(dependentOn);
            parameter.set("_outdatedValue", false);
            this._triggerActionsOnDirectlyDependent(dependentOn, parameter); 
        },
        _filterDirectlyDependentWithOutdatedValue: function(directlyDependent) {
            return this._filterDependentWithOutdatedValue(directlyDependent);
        },
        _filterDirectlyDependent: function(dependentOn, parameter) {
            return _.reduce(dependentOn, function(memo, dependentParam) {
                // exclude triggering parameter (may be the case with self-dependent comboboxes)
                if (dependentParam === parameter) return memo;
                if (_.indexOf(dependentParam.getDependencies(), parameter) > -1) {
                    memo.push(dependentParam);
                }
                return memo;
            }, [], this);
        },
        _markDeeplyDependentWithOutdatedValue: function(dependentOn) {
            _.each(this._filterDependentWithOutdatedValue(dependentOn), function(parameter) {
                parameter.set("_outdatedValue", true);
            });
        },
        _filterDependentWithOutdatedValue: function(dependentOn) {
            return _.filter(dependentOn, function(parameter) {
                return this._testForOutdatedValue(parameter);
            }, this);
        },
        hasOutdatedValue: function(parameter) {
            return parameter.get("_outdatedValue");
        },
        _testForOutdatedValue: function(parameter) {
            return _.size(parameter.getPersistentDependencies()) || 
                            parameter.get("type") === "combobox";
        },
        _triggerActionsOnDirectlyDependent: function(dependentOn, parameter) {
            var directlyDependent = this._filterDirectlyDependent(dependentOn, parameter);
            _.each(directlyDependent, function(dep) {
                this.getVent().trigger("parameters:dependency-changed-value", dep);
            }, this);
        }
    });
});