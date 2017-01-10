/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import BaseBehavior from "../behaviors/ParameterBehavior";
import jst from "./boolTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,
    className: "control-group",

    ui: {
        button: "button"
    },

    events: {
        "click @ui.button":     "_onClick"
    },

    modelEvents: {
        "change:value": "_onModelChangeValue"
    },

    behaviors: {
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    templateHelpers() {
        var defaults = app.channel.request("parameters:views:template-helpers", this);
        return _.extend(defaults, {
            active: this.model.getValue() === true,
            buttonLabel: this.model.getValue() ? "ON" : "OFF",
            buttonClass: ""
        });
    },

    focus() {
        this.ui.button.focus();
    },

    _onClick(e) {
        this.model.setValue(! this.model.getValue());
    },
    _onModelChangeValue(model, isActive) {
        this.ui.button.text(isActive ? "ON" : "OFF");
        this.ui.button[isActive ? "addClass" : "removeClass"]("active");
    }
});
