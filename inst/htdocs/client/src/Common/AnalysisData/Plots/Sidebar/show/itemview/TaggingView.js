/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import AccordionGroup from "../behaviors/AccordionGroupBehavior";
import jst from "./taggingTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,

    ui: {
        nbTagged: "[data-nb-tags]",
        selector: "select",
        tagBtn: "[data-tag]",
        clearBtn: "[data-clear]",
        filterBtn: "[data-filter-tagged]",
        releaseBtn: "[data-release]"
    },

    events: {
        "click @ui.tagBtn": "_onTagButtonClick",
        "click @ui.clearBtn": "_onClearButtonClick",
        "click @ui.filterBtn": "_onFilterButtonClick",
        "click @ui.releaseBtn": "_onReleaseButtonClick",
        "change @ui.selector": "_onSelectorValueChange"
    },

    modelEvents: {
        "change:interactionMode": "_onModelChangeInteractionMode",
        "change:tagFieldIdx": "_onModelChangeTagFieldIdx",
        "change:tagCloudVisible": "_onModelCloudVisibleChanged"
    },

    behaviors: {
        Accordion: {
            behaviorClass: AccordionGroup
        }
    },

    templateHelpers() {
        return {
            items: this.collection.toJSON(),
            _
        };
    },

    initialize: function(opts) {

    },

    setSelectorValueFirstIfNone: function() {
        var $selectedOpt = this.ui.selector.children(":selected"),
                val = parseInt($selectedOpt.attr("value"));
        if (! val) {
            this.ui.selector.children().eq(1).prop("selected", true);
            val = 0;
        }
        this.model.set("tagFieldIdx", val);
    },

    updateNbTagged: function(nb) {
        if (nb == 0) {
            this.ui.nbTagged.text("Tagged: None");
        }
        else {
            this.ui.nbTagged.text("Tagged: "+nb);
        }
    },

    onRender: function() {
        var tdm = this.getOption("tableDataModel");
        this.listenTo(tdm, "change:selected", this.onChangeSelected);
        this.updateNbTagged(_.size(tdm.get("selected")));
    },

    onChangeSelected: function(tableDataModel, selected) {
        this.updateNbTagged(_.size(selected));
    },

    _onSelectorValueChange: function() {
        this.setSelectorValueFirstIfNone();
    },

    _onTagButtonClick: function(e) {
        this.ui.tagBtn.prop("disabled", true);
        this.setSelectorValueFirstIfNone();
        this.trigger("tag:all");
    },

    _onClearButtonClick: function() {
        this.ui.tagBtn.prop("disabled", false);
        this.ui.filterBtn.prop("disabled", true);
        this.trigger("tag:clear");
    },

    _onFilterButtonClick: function() {
        this.ui.releaseBtn.prop("disabled", false);
        this.trigger("tag:filter");
    },

    _onReleaseButtonClick: function() {
        this.ui.filterBtn.prop("disabled", false);
        this.ui.releaseBtn.prop("disabled", true);
        this.trigger("tag:release");
    },

    _onModelCloudVisibleChanged: function(model, visible) {
        this.ui.clearBtn.prop("disabled", ! visible);
        this.ui.filterBtn.prop("disabled", ! visible);
        this.ui.tagBtn.prop("disabled", false);
        this.setSelectorValueFirstIfNone();
    },

    _onModelChangeTagFieldIdx: function(model, idx) {
        this.ui.selector.children().eq(idx+1).prop("selected", true);
    },
    _onModelChangeInteractionMode: function(model, mode) {
        if (mode === "tag") {
            this.triggerMethod("openAccordion");
        }
    }
});
