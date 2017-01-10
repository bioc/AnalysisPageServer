/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("parameters:views:array:listen-to", this.listenToView, this);
    },
    onDestroy() {
        app.channel.stopReplying("parameters:views:array:listen-to");
    },
    listenToView(arrayView) {
        arrayView.on("click:add-btn", args => args.model.addChild());
        arrayView.on("click:remove-btn", args => args.model.destroyLastChild());
    }
});
