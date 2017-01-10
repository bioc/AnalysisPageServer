/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Bacon from "bacon";
import jst from "./template.html!jst";

export default Marionette.LayoutView.extend({

    template: jst,

    ui: {
        caption: "[data-caption]",
        description: "[data-description]"
    },

    regions: {
        parameters: "[data-parameters-region]"
    },

    onRender: function() {
        this.$el.prop("id", this.model.get("name")+"-page-view");
    },

    onShowFully: function() {
        this.getChildView("parameters").triggerMethod("show:fully");
    }
});
