/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon.jquery", "polyfills/requestAnimationFrame"], 
function(Marionette, bjq) {
    return Marionette.ItemView.extend({
        template: "#ep-analysis-tbody-tmpl",
        
        className: "ep-analysis-tbody",
        
        ui: {
            chunks: "[data-chunk-region]"
        },
        
        events: {
            "mouseenter td": "_onMouseenterTd",
            "mouseleave td": "_onMouseleaveTd",
            "mouseenter tr": "_onMouseenterTr",
            "mouseleave tr": "_onMouseleaveTr",
            "click tr": "_onClickTr"
        },
        
        modelEvents: {
            "filter:complete": "_onModelFilterComplete",
            "sort:complete": "_onModelSortComplete",
            "change:newlySelected": "_onModelChangeNewlySelectedRows"
        },
        
        initialize: function() {
            this.chunkTable = [];
        },
        
        getDestroyES: function() {
            return this.asEventStream("before:destroy").take(1);
        },
        
        showExtLabel: function($td) {
            var $extLabel = $td.find(".ep-ext-label");
            if ($extLabel.width() > $td.width()) {
                $extLabel
                        .css("visibility", "visible")
                        .addClass("label");
            }
        },
        hideExtLabel: function($td) {
            var $extLabel = $td.find(".ep-ext-label");
            $extLabel.css("visibility", "hidden");
        },
        showSelectedRows: function($tableChunk) {
            var $actionRange = $tableChunk || this.$el;
            $actionRange.find("tr").removeClass("success");
            _.each(this.model.get("selected"), function(rowId) {
                $("#"+rowId+"-row").addClass("success");
            }, this);
        },
        removeChunks:   function() {
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
        renderChunk: function(id, dataChunk) {
            var chunkTmpl = Marionette.TemplateCache.get("#ep-analysis-table-chunk-tmpl");
            var $chunk = $(chunkTmpl({
                items:  dataChunk,
                meta:   this.model.metaCollection.toArray()
            }));
            $chunk.css("top", id * this.model.get("perChunk") * this.rowHeight);
            this.ui.chunks.append($chunk);
            this.chunkTable[id] = $chunk;
            this.adjustChunkColumnWidth(id);
            this.showSelectedRows($chunk);
            return $chunk;
        },
        renderFirstChunk: function(chunk) {
            this.renderChunk(0, chunk);
            this.cacheHeight(chunk);
            this.adjustHeight(chunk);
            this.triggerMethod("render:first-chunk");
        },
        adjustChunkColumnWidth: function(chunkId) {
            var chunkTable = _.isUndefined(chunkId) ? this.chunkTable : [this.chunkTable[chunkId]];
            var colWidths = this.getOption("tableView").getTheadColumnWidths();
            _.each(chunkTable, function($chunk) {
                if (! $chunk) return;
                $chunk.children("thead").find("th").each(function(i) {
                    $(this).css("width", colWidths[i]);
                });
            });
        },
        adjustWidth: function() {
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
        adjustHeight: function(initialDataChunk) {
            this.ui.chunks.height(Math.ceil(this.model.get("currentSize") * this.rowHeight));
            this.$el.height(Math.ceil(initialDataChunk.length * this.rowHeight));
        },
        cacheHeight: function(chunk) {
            this.chunkHeight = this.chunkTable[0].outerHeight();
            this.rowHeight = this.chunkHeight / chunk.length;
        },
        getWidth: function() {
            return this.ui.chunks.width();
        },
        _onMouseenterTd: function(e) {
            var $td = $(e.currentTarget);
            this.showExtLabel($td);
        },
        _onMouseleaveTd: function(e) {
            var $td = $(e.currentTarget);
            this.hideExtLabel($td);
        },
        _onMouseenterTr: function(e) {
            var $tr = $(e.currentTarget);
            this.trigger("mouseenter:tr", $tr.prop("id").replace("-row", ""));
        },
        _onMouseleaveTr: function(e) {
            var $tr = $(e.currentTarget);
            this.trigger("mouseleave:tr", $tr.prop("id").replace("-row", ""));
        },
        _onClickTr: function(e) {
            var $tr = $(e.currentTarget);
            this.model.setSelectedRows([$tr.prop("id").replace("-row", "")], e.shiftKey);
        },
        _onModelChangeNewlySelectedRows: function() {
            this.showSelectedRows();
        },
        _onModelFilterComplete: function(dataChunk, rowIds) {
            this.removeChunks();
            this.renderChunk(0, dataChunk);
            this.adjustHeight(dataChunk);
        },
        _onModelSortComplete: function(dataChunk) {
            this.removeChunks();
            this.renderChunk(0, dataChunk);
        }
    });
});