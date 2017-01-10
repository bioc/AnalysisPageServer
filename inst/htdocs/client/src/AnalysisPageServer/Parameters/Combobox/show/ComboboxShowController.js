/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";
import ComboboxParameterView from "./itemview/ComboboxParameterView";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:views:combobox:class", this.getViewForModel, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:views:combobox:class");
    },
    createView: function(parameterModel) {

    },
    getViewForModel: function(parameterModel) {
        return ComboboxParameterView;
    }
});
