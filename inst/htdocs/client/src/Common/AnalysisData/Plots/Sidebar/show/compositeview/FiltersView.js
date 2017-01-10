/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import Marionette from "marionette";
import FilterItemView from "./FilterItemView";
import AccordionGroupBehavior from "../behaviors/AccordionGroupBehavior";
import jst from "./template.html!jst";

export default Marionette.CompositeView.extend({
    template: jst,

    ui: {
        label: "[data-label]",
        nbFilters: "[data-nb-filters]"
    },

    behaviors: {
        Accordion: {
            behaviorClass: AccordionGroupBehavior
        }
    },

    events: {
        "mouseenter dt": "_onDtMouseenter",
        "mouseleave dt": "_onDtMouseleave"
    },

    modelEvents: {
        "filter:complete": "_onModelFilterComplete"
    },

    childView: FilterItemView,
    childViewContainer: "[data-inner-region]",
    childViewOptions: function(metaModel, index) {
        return {
            collection: metaModel.filtersCollection
        };
    },

    onRender: function() {
        this.updateHeader();
    },

    updateHeader: function() {
        var nbActive = this.model.filtersCollection.reduce(function(memo, filterModel) {
            return memo + (filterModel.has("value") ? 1 : 0);
        }, 0);
        // check if points on the plot were selected
        nbActive += this.model.get("filteredByIds") ? 1 : 0;
        if (nbActive > 0) {
            this.ui.label.text("Filters: "+nbActive);
            this.ui.nbFilters.text("Showing "+this.model.get("currentSize")+" of "+this.model.get("size"));
        }
        else {
            this.ui.nbFilters.text("Showing All "+this.model.get("size"));
            this.ui.label.text("Filters: None");
        }
    },

    _onModelFilterComplete: function() {
        this.updateHeader();
    },

    _onDtMouseenter: function(e) {
        var $dt = $(e.currentTarget);
        var $extLabel = $dt.children(".ep-ext-label");
        if ($dt.width() < $extLabel.width()) {
            $extLabel.css("visibility", "visible");
        }
    },
    _onDtMouseleave: function(e) {
        var $dt = $(e.currentTarget);
        $dt.children(".ep-ext-label").css("visibility", "hidden");
    }
});
