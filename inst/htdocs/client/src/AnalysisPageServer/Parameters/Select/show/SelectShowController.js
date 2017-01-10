/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import getSelectParameterView from "./itemview/getSelectParameterView";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:views:select:class", this.getViewForModel, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:views:select:class");
    },
    getViewForModel: function(parameterModel) {
        return getSelectParameterView({
                    model: parameterModel
                });
    }
});
