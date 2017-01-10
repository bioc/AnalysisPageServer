/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Bacon from "bacon";
import template from "./template.html!jst";

export default Marionette.LayoutView.extend({

    template,

    ui: {
        captionRow: "[data-caption-row]",
        caption: "[data-caption]"
    },

    regions: {
        analysis: "[data-analysis-region]"
    },

    modelEvents: {
        "change:label": "_onModelChangeLabel"
    },

    onRender() {
        this.$el.prop("id", this.model.get("name")+"-page-view");
    },
    onShowFully() {
        this.getChildView("analysis").triggerMethod("show:fully");
    },
    _onModelChangeLabel(model, label) {
        this.ui.captionRow[label ? "show" : "hide"]();
        this.ui.caption.text(label);
    }
});
