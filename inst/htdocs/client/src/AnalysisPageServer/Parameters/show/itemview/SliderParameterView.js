/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Bacon from "bacon";
import Marionette from "marionette";
import app from "app";
import BaseBehavior from "../behaviors/ParameterBehavior";
import jst from "./sliderTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,
    className: "control-group",

    ui: {
        field: "input[type=range]",
        label: "label span"
    },

    events: {
        "change": "_onChange",
        "input": "_onInput"
    },

    modelEvents: {
        "change:value": "_onModelChangeValue"
    },

    templateHelpers() {
        var defaults = app.channel.request("parameters:views:template-helpers", this);
        return _.extend(defaults, {
            min: this.model.get("min"),
            max: this.model.get("max"),
            step: this.model.get("step")
        });
    },

    behaviors: {
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    focus() {
        this.ui.field.focus();
    },

    _onModelChangeValue(model, value) {
        this.ui.field.val(value);
    },
    _onInput() {
        var val = this.ui.field.val();
        this.ui.label.text(val);
    },
    _onChange() {
        var val = this.ui.field.val();
        if (val == null) {
            this.model.unsetValue();
        }
        else {
            this.model.setValue(parseFloat(val), {viewTriggered: true});
        }
    }
});
