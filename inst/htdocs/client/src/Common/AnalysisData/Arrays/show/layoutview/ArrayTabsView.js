/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import Marionette from "marionette";
import jst from "./tabsTemplate.html!jst";
import "bootstrap";

export default Marionette.LayoutView.extend({
    template: jst,

    regions: {
        nav: "[data-nav]",
        content: "[data-content]"
    },
    events: {
        "click .nav-tabs a[data-toggle='tab']": "_onClickTabNav"
    },

    _onClickTabNav: function(e) {
        e.preventDefault();
        this.trigger("click:tab", {
            view: this,
            collection: this.collection,
            // passing index only is unreliable here,
            // selecting tab content based on index might lead to blank
            // space if some of previous tabs were not yet rendered
            index: $(e.currentTarget).parent().index(),
            selectedModel: this.collection.at($(e.currentTarget).parent().index())
        });
    }
});
