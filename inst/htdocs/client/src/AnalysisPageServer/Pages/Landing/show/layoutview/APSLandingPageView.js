/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "./ep-landing.less!";
import jst from "./APStemplate.html!jst";
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";

export default Marionette.LayoutView.extend({

    template: jst,

    ui: {

    },

    regions: {
        toolOverview: "[data-tool-overview-region]"
    },

    onRender: function() {
        this.$el.prop("id", this.model.get("name")+"-page-view");
    },

    onShowFully: function() {
        this.getRegion("toolOverview").currentView.triggerMethod("show:fully");
    }
});
