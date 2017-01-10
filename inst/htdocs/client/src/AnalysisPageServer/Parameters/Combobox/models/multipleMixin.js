/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";

export default function(ParentModel) {
    return [{
            defaults() {
                return {
                    value: [],
                    readable: []
                };
            },
            hasValueInSuggestions() {
                return _.reduce(this.get("suggestions"), (has, suggestion) => {
                    return has || _.indexOf(this.getValue(), suggestion.id) > -1
                }, false, this);
            },
            updateFromView(props, opts) {
                // first update readable attribute according to view's .val
                var r, prevVPos, value;
                // necessary to prevent situation when a string is compared to a number
                value = _.map(this.getValue(), v => v && v.toString());
                r = _.map(props.val, v => {
                    prevVPos = _.indexOf(value, v && v.toString());
                    if (prevVPos === -1 && props.added) {// it's not found so probably new value
                        return props.added.text;
                    }
                    else {// found in previous values
                        return this.get("readable")[prevVPos];
                    }
                }, this);
                this.set("readable", r, opts);
                this.setValue(props.val, opts);
            },
            selectAll(opts) {
                this.set("readable", _.map(this.get("suggestions"), s => s.long_name), opts);
                this.setValue(_.map(this.get("suggestions"), s => s.id), opts);
            },
            deselectAll() {
                this.set("readable", []);
                this.setValue([]);
            },
            reset() {
                this.setValue([]);
                this.set("readable", []);
                this.unset("suggestions");
                if (this.get("selfDependent")) this.unset("searchTerm");
            }
    }, {}];
};
