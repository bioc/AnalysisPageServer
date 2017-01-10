/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";
import ExpandableTextBehavior from "Common/Behaviors/ExpandableTextBehavior";
import jst from "./itemTemplate.html!jst";
import summaryJst from "./summaryTemplate.html!jst";
import "bootstrap";
import "velocity/velocity.ui";
import "bacon.jquery";

export default Marionette.CompositeView.extend({
    template: jst,
    tagName: "th",

    behaviors: {
        ExpandableText: {
            behaviorClass: ExpandableTextBehavior,
            mode: "simple",
            elSelector: ".ep-visible-label",// within triggerSelector
            triggerSelector: ".ep-th-label"
        }
    },

    getChildView: function() {
        return app.channel.request("analysis-data:views:table:filter:class");
    },
    childViewContainer: "[data-filters-region]",

    ui: {
        labelBox: ".ep-th-label",
        label: ".ep-visible-label",
        wrapper: ".ep-th",
        filterBtn: "[data-filter-action]",
        sortBtn: "[data-sort-action]"
    },

    triggers: {

    },

    events: {
        "click @ui.sortBtn": "_onClickSortBtn"
    },

    modelEvents: {
        "change:sortOrder": "_onModelChangeSortOrder"
    },

    onRender: function() {

    },

    _getPopoverPlacement: function() {
        var idx = this.model.collection.indexOf(this.model),
        nbCols = this.model.collection.size();
        return idx === 0 ? "right" : (idx === nbCols-1 ? "left" : "bottom");
    },
    showFilters: function() {
        this.hideFilters();
        var label = this.model.get("label");
        this.ui.filterBtn.popover({
            html:       true,
            trigger:    "manual",
            title:      "'"+label+"' values",
            placement:  this._getPopoverPlacement(),
            // What is done here is to pass an array of DOM elements to be displayed
            // as content of a popover - weird trick. This way these elements
            // aren't destroyed when popover is destroyed
            content:    this.children.pluck("$el"),
            container:  this.$el
        }).popover("show");
//            this.ui.filterBtn.data("popover").$tip.attr("data-id", $(iconEl).prop("id"));
        this.children.findByIndex(0).focus();

    },
    hideFilters: function() {
        if (this.ui.filterBtn.data("popover")) {
            this.ui.filterBtn.popover("destroy");
        }
    },
    toggleFilters: function() {
        if (this.ui.filterBtn.data("popover")) {
            this.hideFilters();
        }
        else {
            this.showFilters();
        }
    },
    showSummary: function(summary) {
        var summaryKeys = _.keys(summary);
        var $div = $("<div></div>");
        summaryKeys = _.map(summaryKeys, key => $div.html(key).text());
        summary = _.object(summaryKeys, _.values(summary));
        var listHtml = summaryJst({items: summary, _});
        var title = this.model.get("description") || this.model.get("label");
        this.ui.labelBox.popover({
            html:       true,
            title:      title,
            placement:  this._getPopoverPlacement(),
            content:    listHtml,
            trigger:    "manual",
            container:  this.$el
        }).popover("show");
//                $(labelEl).data("popover").$tip.attr("data-id", $(labelEl).prop("id"));
    },
    hideSummary: function() {
        if (this.ui.labelBox.data("popover")) {
            this.ui.labelBox.popover("destroy");
        }
    },
    toggleSummary: function(summary) {
        if (summary) {
            this.showSummary(summary);
        }
        else {
            this.hideSummary();
        }
    },
    emphasize: function(yes) {
        this.ui.label[yes ? "addClass" : "removeClass"]("label label-info");
        this.triggerMethod("emphasizeExpandedText", yes, this.ui.label, "label label-info");
        this.ui.filterBtn.velocity({opacity: yes ? 1 : 0.7});
    },
    _onClickSortBtn: function(e) {
        var order = this.model.get("sortOrder");
        if (order) {
            this.model.set("sortOrder", order === "asc" ? "desc" : "asc");
        }
        else {
            this.model.set("sortOrder", "asc");
        }
    },
    _onModelChangeSortOrder: function(model, sortOrder, opts) {
        if (opts.unset) {
            this.ui.sortBtn.velocity({opacity: 0.7});
        }
        else {
            this.ui.sortBtn.velocity({opacity: 1});
            this.ui.sortBtn.removeClass("icon-arrow-up icon-arrow-down")
                    .addClass(sortOrder === "desc" ? "icon-arrow-down" : "icon-arrow-up");
        }
    }

});
