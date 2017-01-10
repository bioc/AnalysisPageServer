/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";

export default Marionette.ItemView.extend({

    className: "control-group",

    modelEvents: {
        "change:value": "_onModelChangeValue"
    },

    initialize() {

    },

    templateHelpers() {
        return app.channel.request("parameters:views:template-helpers", this);
    },

    _prepareChoices() {
        var choices = this.model.get("choices"), viewChoices = [];
        for (var key in choices) {
            viewChoices.push({
                value:      key,
                label:      choices[key],
                selected:   this.model.get("value") == key
            });
        }
        return viewChoices;
    },

    _setModelValue(val) {
        this.model.setValue(val, {viewTriggered: true});
    },

    _onModelChangeValue() {

    }
});
