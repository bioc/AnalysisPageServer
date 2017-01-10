/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import SummaryView from "./compositeview/ParametersSummaryView";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("parameters:views:summary", this.getView, this);
    },
    onDestroy() {
        app.channel.stopReplying("parameters:views:summary");
    },
    getView(parameters, withModify) {
        var v = new SummaryView({
            withModify: withModify,
            collection: parameters
        });
        return v;
    }
});
