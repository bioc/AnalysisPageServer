/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:html", this.getView, this);
        app.channel.reply("analysis-data:views:simple", this.getView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:html");
        app.channel.stopReplying("analysis-data:views:simple");
    },
    getView: function(analysis) {
        var $el = $("<div></div>");
        $el.html(analysis.value);
        return new Marionette.ItemView({
            template: false,
            el: $el
        });
    }
});
