/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import TheadView from "./compositeview/TheadView";
import Bacon from "bacon";
import "bacon.jquery";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:table:thead", this.getView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:table:thead");
    },
    getView: function(tableView) {
        var self = this;
        var v = new TheadView({
            model: tableView.model,
            collection: tableView.model.metaCollection,
            tableView: tableView
        });
        this.listenTo(v, "childview:render", _.partial(this._onChildViewRender, tableView.model));
        v.once("destroy", function() {
            self.stopListening(v);
        });
        return v;
    },
    initializeSummaryProp: function(tableDataModel, itemView) {
        var mouseenterE = itemView.ui.labelBox.mouseenterE();
        var mouseleaveE = itemView.ui.labelBox.mouseleaveE();
        var summaryVisible =
                mouseenterE.map(true)
                .merge(mouseleaveE.map(false))
                .toProperty(false);
        summaryVisible
                .takeUntil(itemView.getDestroyES())
                .flatMapLatest(this, "_mapToSummary", tableDataModel, itemView.model)
                .onValue(itemView, "toggleSummary");
    },
    _mapToSummary: function(tableDataModel, itemModel, summaryVisible) {
        if (summaryVisible) {
            return Bacon.fromNodeCallback(tableDataModel, "getSummary", itemModel.get("idx"))
                    .map(".summary");
        }
        else {
            return false;
        }
    },
    initializeFiltersProp: function(itemView) {
        var clickE = itemView.ui.filterBtn.clickE();
        var mouseenterE = itemView.ui.filterBtn.mouseenterE();
        var mouseleaveE = itemView.ui.filterBtn.mouseleaveE();
        var popoverMouseenterE = itemView.$el.mouseenterE(".popover");
        var popoverMouseleaveE = itemView.$el.mouseleaveE(".popover");
        var filtersVisible =
                mouseenterE.map(true)
                .merge(mouseleaveE.map(false))
                .merge(popoverMouseenterE.map(true))
                .merge(popoverMouseleaveE.map(false))
                .toProperty(false);
        clickE
                .takeUntil(itemView.getDestroyES())
                .onValue(itemView, "toggleFilters");
        mouseleaveE
                .debounce(500)
                .filter(filtersVisible.not())
                .takeUntil(itemView.getDestroyES())
                .onValue(itemView, "hideFilters");
        popoverMouseleaveE
                .takeUntil(itemView.getDestroyES())
                .onValue(itemView, "hideFilters");
    },
    _onChildViewRender: function(tableDataModel, itemView) {
        var self = this;
        this.initializeFiltersProp(itemView);
        this.initializeSummaryProp(tableDataModel, itemView);
        itemView.collection.each(function(filterModel) {
            this.listenTo(filterModel, "filter:complete",
                _.partial(this._onFilterModelComplete, itemView, tableDataModel));
            itemView.once("destroy", function() {
                self.stopListening(filterModel);
            });
        }, this);
    },
    _onFilterModelComplete: function(itemView, tableDataModel, filterModel) {
        if (filterModel.has("value")) {
            itemView.emphasize(true);
        }
        // additionally check for other column filters before taking away styles
        else if (! tableDataModel.anyColumnFilterHasValue(filterModel.get("idx"))) {
            itemView.emphasize(false);
        }
    }

});
