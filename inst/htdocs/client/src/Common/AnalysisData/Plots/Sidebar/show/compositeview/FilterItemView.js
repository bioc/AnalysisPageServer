/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import jst from "./itemTemplate.html!jst";
import "bootstrap";

export default Marionette.CompositeView.extend({
    template: jst,
    tagName: "li",

    getChildView: function() {
        return app.channel.request("analysis-data:views:table:filter:class");
    },
    childViewContainer: "[data-filters-region]",
    childViewOptions: {
        className: "input-prepend ep-analysis-filter"
    }

});
