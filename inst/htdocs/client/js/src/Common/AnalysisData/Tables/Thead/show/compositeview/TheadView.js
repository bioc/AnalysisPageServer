/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "./TheadItemView", "bootstrap",
    "jquery-resizable-columns"], 
    function(Marionette, Bacon, TheadItemView) {
        
    return Marionette.CompositeView.extend({
        template: "#ep-analysis-thead-tmpl",
        tagName: "table",
        className: "ep-analysis-thead table-bordered",
        
        triggers: {
            "column:resize:stop": "resize:column"
        },
        
        childView: TheadItemView,
        childViewContainer: "tr",
        childViewOptions: function(metaModel, index) {
            return {
                collection: metaModel.filtersCollection
            };
        },
        
        initialize: function() {

        },
        onBeforeDestroy: function() {
            this.$el.resizableColumns("destroy");
        },

        adjustWidth: function() {
            var regionWidth = this.$el.parent().width() - 15;// leave some space for tbody scrollbar
            // to accomodate all columns if there are many of them
            var proposedWidth = this.collection.size() * 70;
            this.$el.width(Math.max(regionWidth, proposedWidth));
        },
        getWidth: function() {
            return this.$el.width();
        },
        enableResizableColumns: function() {
            this.$el.resizableColumns();
        },
        syncHandleWidths: function() {
            this.$el.resizableColumns("syncHandleWidths");
        },
        getColumnWidths: function() {
            return _.map(this.$("th").toArray(), function(th) {
                return th.style.width;
            });
        }
    });
});