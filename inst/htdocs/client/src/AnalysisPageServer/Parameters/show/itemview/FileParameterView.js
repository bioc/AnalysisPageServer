/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import BaseBehavior from "../behaviors/ParameterBehavior";
import jst from "./fileTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,
    className: "control-group",

    ui: {
        field: "input[type=file]"
    },

    events: {
        "change @ui.field": "_onChange"
    },

    templateHelpers() {
        return app.channel.request("parameters:views:template-helpers", this);
    },

    Base: {
        behaviorClass: BaseBehavior
    },

    focus() {
        this.ui.field.focus();
    },

    _onChange(e) {
        var file = e.target.files[0];
        this.model.setValue(file);
    }
});
