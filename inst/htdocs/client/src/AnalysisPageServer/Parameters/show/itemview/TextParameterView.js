/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import BaseBehavior from "../behaviors/ParameterBehavior";
import jst from "./textTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,
    className: "control-group",

    ui: {
        field: "input"
    },

    events: {
        "keyup input": "onKeyup"
    },

    modelEvents: {
        "change:value": "onModelChangeValue"
    },

    templateHelpers() {
        return app.channel.request("parameters:views:template-helpers", this);
    },

    behaviors: {
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    focus() {
        this.ui.field.focus();
    },

    onModelChangeValue(model, value, opts) {
        opts.viewTriggered || this.ui.field.val(value);
    },

    onKeyup(e) {
        var val = this.ui.field.val();
        if (val == null) this.model.unsetValue();
        else this.model.setValue(val, {viewTriggered: true});
    }
});
