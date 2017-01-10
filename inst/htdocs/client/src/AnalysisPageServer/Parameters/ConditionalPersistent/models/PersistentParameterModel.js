/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";

export default Backbone.Model.extend({
    initialize() {

    },

    insertOrUpdateConditionalValue(parameter, value) {
        if (! this.updateConditionalValue(parameter, value)) {
            this.insertConditionalValue(parameter, value);
        }
        this.save();
    },

    insertConditionalValue(parameter, value) {
        if (value === void 0) return;
        var row = {
            dependent: this.getDependentValues(parameter),
            value: value,
            lastUsed: (new Date).getTime()
        };
        var values = this.get("conditionalValues") || [];
        values.push(row);
        this.set("conditionalValues", values);
        this.trigger("update:conditionalValue", this, parameter);
    },

    updateConditionalValue(parameter, value) {
        var valueRow = this.findConditionalValue(parameter);
        if (valueRow) {
            if (value === void 0) {// value is undefined thus remove persisted value row
                let rowIdx = -1;
                _.each(this.get("conditionalValues"), (condValueRow, i) => {
                    _.isEqual(condValueRow, valueRow) && (rowIdx = i);
                });
                rowIdx > -1 && this.get("conditionalValues").splice(rowIdx, 1);
            }
            else {
                valueRow.value = value;
                valueRow.lastUsed = (new Date).getTime();
                this.trigger("update:conditionalValue", this, parameter);
            }
            return true;
        }
        else {
            return false;
        }
    },

    findConditionalValue(parameter) {
        var idx = -1;
        var dependentValues = this.getDependentValues(parameter);
        _.find(this.get("conditionalValues"), (conditionalValue, i) => {
            if (_.size(dependentValues) !== _.size(conditionalValue.dependent)) return false;
            var matchingDependencies = _.reduce(dependentValues, (memo, depValue, depName) => {
                return memo && !!conditionalValue.dependent[depName]
                            && conditionalValue.dependent[depName] == depValue;

            }, true);
            if (matchingDependencies) {
                idx = i;
                return true;
            }
            else {
                return false;
            }
        });
        // return by reference - that's why find won't work
        return idx > -1 ? this.get("conditionalValues")[idx] : null;
    },

    getDependentValues(parameter) {
        // add additional check for i.e. study param having study persistent dependency
        // sent by server
        var persDeps = _.without(parameter.getPersistentDependencies(), parameter);
        return _.reduce(persDeps, (memo, dep) => {
            if (dep) {
                memo[dep.get("persistent")] = dep.getValue();
            }
            return memo;
        }, {});
    }
});
