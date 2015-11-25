/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", 
    "./compositeview/TheadView", "bacon", "bacon.jquery"], 
function(Marionette, TheadView, Bacon) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:table:thead", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
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
        initializeExtLabelProp: function(itemView) {
            var mouseenterE = itemView.ui.labelBox.mouseenterE();
            var mouseleaveE = itemView.ui.labelBox.mouseleaveE();
            var extLabelVisible = 
                    mouseenterE.map(true)
                    .merge(mouseleaveE.map(false))
                    .toProperty(false);
            extLabelVisible
                    .takeUntil(itemView.getDestroyES())
                    .onValue(itemView, "toggleExtLabel");
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
            this.initializeExtLabelProp(itemView);
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
                itemView.ui.label.addClass("label label-info");
                itemView.ui.extLabel.addClass("label label-info");
                itemView.ui.filterBtn.velocity({opacity: 1});
            }
            // additionaly check for other column filters before taking away styles
            else if (! tableDataModel.anyColumnFilterHasValue(filterModel.get("idx"))) {
                itemView.ui.label.removeClass("label label-info");
                itemView.ui.extLabel.removeClass("label label-info");
                itemView.ui.filterBtn.velocity({opacity: 0.7});
            }
        }
        
    });
});