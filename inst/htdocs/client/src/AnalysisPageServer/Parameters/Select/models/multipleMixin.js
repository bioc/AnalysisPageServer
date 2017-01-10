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
                    value: []
                };
            },
            selectAll(opts) {
                this.setValue(_.map(this.get("choices"), (text, id) => id), opts);
            },
            deselectAll() {
                this.setValue([]);
            },
            reset() {
                this.setValue([]);
            }
    }, {}];
};
