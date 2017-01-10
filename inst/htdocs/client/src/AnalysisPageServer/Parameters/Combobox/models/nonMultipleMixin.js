/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";

export default function(ParentModel) {
    return [{
            hasValueInSuggestions() {
                return _.reduce(this.get("suggestions"), (has, suggestion) => {
                    return has || this.getValue() == suggestion.id
                }, false, this);
            },
            updateFromView(props, opts) {
                if (props.added) {
                    this.set("readable", props.added.text, opts);
                    this.setValue(props.added.id, opts);
                }
                else if (props.removed) {
                    props.removed.text === this.get("readable") && this.unset("readable", opts);
                    props.removed.id === this.getValue() && this.unsetValue(opts);
                }
            }
    }, {}];
};
