/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import TheadItemView from "./TheadItemView";
import jst from "./template.html!jst";
import "bootstrap";
import ResizableColumns from "jquery-resizable-columns/src/class";
import "jquery-resizable-columns/dist/jquery.resizableColumns.css!less";

export default Marionette.CompositeView.extend({
    template: jst,
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
        this.resizableColumns && this.resizableColumns.destroy();
        // this.$el.resizableColumns("destroy");
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
        this.resizableColumns = new ResizableColumns(this.$el);
        // this.$el.resizableColumns();
    },
    syncHandleWidths: function() {
        this.resizableColumns.syncHandleWidths();
        // this.$el.resizableColumns("syncHandleWidths");
    },
    getColumnWidths: function() {
        return _.map(this.$("th").toArray(), function(th) {
            return th.style.width;
        });
    }
});
