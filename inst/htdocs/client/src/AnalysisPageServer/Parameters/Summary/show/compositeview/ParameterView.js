/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 * It renders parameter values as uneditable list.
 * Present at first in sidebar after loading analysis plot response.
 */
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import jst from "./itemTemplate.html!jst";

export default Marionette.CompositeView.extend({
    template: jst,
    tagName: "li",

    childViewContainer: "ul",
    childViewOptions(childModel) {
        return {
            isRoot: false,
            collection: childModel.children
        };
    },

    templateHelpers() {
        return {
            isRoot: this.getOption("isRoot"),
            readableLabel: this.getReadableLabel(),
            readableValue: this.getReadableValue()
        };
    },

    initialize() {
        this.model.isActive()
                .takeUntil(this.getDestroyES())
                .onValue(this, "_onChangeActive");
    },

    getReadableValue() {
        var v = this.model.get("readable") || this.model.get("value");
        if (_.isBoolean(v)) {
            return v ? "true" : "false";
        }
        else {
            return _.isArray(v) ? (v || []).join("<br/>") : v;
        }
    },

    getReadableLabel() {
        if (this.model.parent && this.model.parent.get("type") === "array") {
            return this.model.parent.children.indexOf(this.model)+1;
        }
        else {
            return this.model.get("label");
        }
    },

    _onChangeActive(isActive) {
        this.$el[isActive ? "removeClass" : "addClass"]("hide");
    }
});
