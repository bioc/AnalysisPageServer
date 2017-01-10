/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import ExpandableTextBehavior from "Common/Behaviors/ExpandableTextBehavior";
import bjq from "bacon.jquery";
import jst from "./template.html!jst";
import chunkJst from "./chunkTemplate.html!jst";
import "polyfills/requestAnimationFrame";

export default Marionette.ItemView.extend({
    template: jst,

    className: "ep-analysis-tbody",

    behaviors: {
        ExpandableText: {
            behaviorClass: ExpandableTextBehavior,
            mode: "simple",
            elSelector: "div",// within triggerSelector
            triggerSelector: "tbody tr td"
        }
    },

    ui: {
        chunks: "[data-chunk-region]"
    },

    events: {
        "mouseenter tr": "_onMouseenterTr",
        "mouseleave tr": "_onMouseleaveTr",
        "click tr": "_onClickTr"
    },

    modelEvents: {
        "filter:complete": "_onModelFilterComplete",
        "sort:complete": "_onModelSortComplete",
        "change:newlySelected": "_onModelChangeNewlySelectedRows"
    },

    initialize() {
        this.chunkTable = [];
    },

    showSelectedRows($tableChunk) {
        var $actionRange = $tableChunk || this.$el;
        let $trs = $actionRange.find("tr");
        $trs.removeClass("success");
        _.each(this.model.get("selected"), rowId => {
            $trs.filter("[data-item-id='"+rowId+"']").addClass("success");
        }, this);
    },
    removeChunks() {
        this.chunkTable = [];
        this.ui.chunks.empty();
        this.$el.scrollTop(0);
    },
    /**
     *
     * @param {Integer} id
     * @param {Array} dataChunk
     * @returns {jQuery}
     */
    renderChunk(id, dataChunk) {
        var $chunk = $(chunkJst({
            items:  dataChunk,
            meta:   this.model.metaCollection.toArray(),
            _
        }));
        $chunk.css("top", id * this.model.get("perChunk") * this.rowHeight);
        this.ui.chunks.append($chunk);
        this.chunkTable[id] = $chunk;
        this.adjustChunkColumnWidth(id);
        this.showSelectedRows($chunk);
        return $chunk;
    },
    renderFirstChunk(chunk) {
        this.renderChunk(0, chunk);
        this.cacheHeight(chunk);
        this.adjustHeight(chunk);
        this.triggerMethod("render:first-chunk");
    },
    adjustChunkColumnWidth(chunkId) {
        var chunkTable = _.isUndefined(chunkId) ? this.chunkTable : [this.chunkTable[chunkId]];
        var colWidths = this.getOption("tableView").getTheadColumnWidths();
        _.each(chunkTable, $chunk => {
            if (! $chunk) return;
            $chunk.children("thead").find("th").each((i, th) => {
                $(th).css("width", colWidths[i]);
            });
        });
    },
    adjustWidth() {
        var w = this.getOption("tableView").getTheadWidth();
        this.$el.width(w+15);// accomodate scrollbar
    },
    /**
     * Called when height of the table needs to be adjusted based on
     * varying amount of all rows initially or in effect of filtering
     * @param {Integer} size
     * @param {Array} initialDataChunk
     * @returns {undefined}
     */
    adjustHeight(initialDataChunk) {
        this.ui.chunks.height(Math.ceil(this.model.get("currentSize") * this.rowHeight));
        this.$el.height(Math.ceil(initialDataChunk.length * this.rowHeight));
    },
    cacheHeight(chunk) {
        this.chunkHeight = this.chunkTable[0].outerHeight();
        this.rowHeight = this.chunkHeight / chunk.length;
    },
    getWidth() {
        return this.ui.chunks.width();
    },
    _onMouseenterTr(e) {
        var $tr = $(e.currentTarget);
        this.trigger("mouseenter:tr", $tr.attr("data-item-id"));
    },
    _onMouseleaveTr(e) {
        var $tr = $(e.currentTarget);
        this.trigger("mouseleave:tr", $tr.attr("data-item-id"));
    },
    _onClickTr(e) {
        var $tr = $(e.currentTarget);
        this.model.setSelectedRows([$tr.attr("data-item-id")], e.shiftKey);
    },
    _onModelChangeNewlySelectedRows() {
        this.showSelectedRows();
    },
    _onModelFilterComplete(dataChunk, rowIds) {
        this.removeChunks();
        this.renderChunk(0, dataChunk);
        this.adjustHeight(dataChunk);
    },
    _onModelSortComplete(dataChunk) {
        this.removeChunks();
        this.renderChunk(0, dataChunk);
    }
});
