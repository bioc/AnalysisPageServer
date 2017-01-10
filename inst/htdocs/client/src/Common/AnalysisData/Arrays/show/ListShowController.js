/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:array:list:initialize", this.initializeView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:array:list:initialize");
    },
    initializeView: function(listView) {


    }
});
