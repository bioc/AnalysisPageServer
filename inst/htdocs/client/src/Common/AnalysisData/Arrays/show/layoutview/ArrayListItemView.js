/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import jst from "./itemTemplate.html!jst";

export default Marionette.LayoutView.extend({
    template: jst,

    regions: {
        content: "[data-content]"
    },

    onRender: function() {
        var v = app.channel.request("analysis-data:views:"+this.model.get("type"),
                this.model.analysisData, {
                    pageModel: this.getOption("pageModel")
                });
        v && this.getRegion("content").show(v);
    }
});
