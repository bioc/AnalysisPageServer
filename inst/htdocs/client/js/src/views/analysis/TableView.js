/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager", 
    "views/analysis/FilterView", "bacon", "functions/requestAnimationFrame",
    "bootstrap", "jquery-resizable-columns"], 
    function(Backbone, TemplateManager, FilterView, Bacon) {
        
    function same(k, o, e) {
        return e[k] === o;
    }
        
    var TableView = Backbone.View.extend({
        chunkTable:     null,
        $actionIcons:   null,
        visibleChunkIdx:0,
        chunkHeight:    0,
        rowHeight:      0,
        timer:          null,
        /**
         * An array of thead filter views
         * @type Array
         */
        filters:    null,
        events:     {
            "column:resize:stop":                    "onTableColumnResized",
            "mouseenter .ep-analysis-thead .ep-th-label":  "onLabelMouseenter",
            "mouseleave .ep-analysis-thead .ep-th-label":  "onLabelMouseleave",
            "mouseenter .ep-analysis-thead .ep-th":  "onThMouseenter",
            "mouseleave .ep-analysis-thead .ep-th":  "onThMouseleave",
            "mouseenter .ep-analysis-thead i":       "onActionIconMouseenter",
            "mouseleave .ep-analysis-thead i":       "onActionIconMouseleave",
            "click .ep-analysis-thead i":            "onActionIconClick",
            "hide .ep-analysis-thead i":             "onPopoverHide",
            "mouseenter .ep-analysis-tbody td":      "onTdMouseenter",
            "mouseleave .ep-analysis-tbody td":      "onTdMouseleave",
            "mouseenter .popover":                   "onPopoverMouseenter",
            "mouseleave .popover":                   "onPopoverMouseleave",
            "mouseleave":                            "onMouseleave"
        },
        className:  "ep-analysis-table",
        initialize: function(opts) {
            _.extend(this, _.pick(opts, [
                "pageView", "pageModel", "appView", "eventBus", "parent"
            ]));
            this.perChunk = this.model.perChunk;
            this.beforeRemoveES = this.asEventStream("before:remove").take(1);
            this.initializeEventBus();
            this.$el.attr("id", this.cid).addClass(this.className);
            this.filters = [];
            this.chunkTable = [];
            this.listenTo(this.model, "filter:complete", this.onFilterComplete);  
            $(window).on("resize."+this.cid, $.proxy(this.onWindowResize, this));
            this.initializeDomEventStreams();
        },
                
        initializeEventBus: function() {
            var pageViewShownES = this.eventBus
                    .filter(".pageViewShown")
                    .filter(same, "pageView", this.pageView)
                    .map(true)
                    // either page view is already shown or will be in short time
                    .toProperty(this.pageView.isShown())
                    .filter(function(isShown) {
                        return isShown;// include only "true" in stream
                    });
            var viewRenderedES = this.eventBus
                    .filter(".tableViewRendered")
                    .filter(same, "tableView", this);
            // Resizable feature can be attached only when table view is rendered
            // and page view containing it is shown
            // sync these events here
            Bacon.combineAsArray(
                    pageViewShownES,
                    viewRenderedES
                    )
                    .take(1)
                    .flatMapLatest(this, "_getDataChunkE", 0)
                    .map(".chunk")
                    .onValue(this, "_renderFirstChunk");
        },
            
        initializeDomEventStreams: function() {
            this.$el.asEventStream("click", ".ep-download-csv")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this.model, "saveAsCsv", this.pageModel.get("label")+".csv", null);
        },
        
        onScroll:   function(e) {
            var view = this;
            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(function() {
                var scrollTop = view.$el.children(".ep-analysis-tbody").scrollTop(),
                    possibleChunkId = parseInt(scrollTop / view.chunkHeight),
                    chunkIds = view.getUnrenderedChunkIds(possibleChunkId);

                _.each(chunkIds, function(chunkId) {
                    view.model.getDataChunk(chunkId, view.perChunk, function(errors, result) {
                        view.renderChunk(chunkId, result.chunk);
                    });
                });
            }, 300);
            
        },
        
        getUnrenderedChunkIds:   function(testId) {
            var ids = [];
            if (typeof this.chunkTable[testId] === "undefined") {
                ids.push(testId);
            }
            if (testId-1 > -1 && typeof this.chunkTable[testId-1] === "undefined") {
                ids.push(testId-1);
            }
            if (typeof this.chunkTable[testId+1] === "undefined") {
                ids.push(testId+1);
            }
            return ids;
        },
        
        removeChunks:   function() {
            this.chunkTable = [];
            this.$el.children(".ep-analysis-tbody").children().empty();
            this.$el.children(".ep-analysis-tbody").scrollTop(0);
        },
        /**
         * 
         * @param {Integer} id
         * @param {Array} dataChunk
         * @returns {jQuery}
         */
        renderChunk:    function(id, dataChunk) {
            var $chunk = $(TemplateManager.render("ep-analysis-table-chunk-tmpl", {
                id:     this.cid + "-" + id,
                items:  dataChunk,
                meta:   this.model.get("meta")
            }));
            var $thead = this.$el.children(".ep-analysis-thead"),
                $tbody = this.$el.children(".ep-analysis-tbody");
            $chunk.css("top", id * this.perChunk * this.rowHeight);
            var $theadThs = $thead.find("th");
            $chunk.children("thead").find("th").each(function(i) {
                $(this).css("width", $theadThs.eq(i).get(0).style.width);
            });
            $tbody.children().append($chunk);
            this.chunkTable[id] = $chunk;
            return $chunk;
        },
        
        _getDataChunkE: function(id) {
            return Bacon.fromNodeCallback(this.model, "getDataChunk", id, this.perChunk);
        },
        
        _renderFirstChunk: function(chunk) {
            this.makeColumnsResizable();
            this.renderChunk(0, chunk);
            this._cacheHeight(chunk);
            this.adjustHeight(this.model.get("currentSize"), chunk);
            this.adjustTheadWidth();
        },
        
        renderSkeleton: function() {
            var extMeta = [], sizeMeta = _.size(this.model.get("meta"));
            _.each(this.model.get("meta"), function(itemMeta, i) {
                var cloned = _.clone(itemMeta);
                cloned.baseId = _.uniqueId(this.cid+"-");
                cloned.isLast = i === sizeMeta -1;
                extMeta.push(cloned);
            }, this);
            var t = TemplateManager.render("ep-analysis-table-tmpl", {
                meta:           extMeta,
                withoutPlot:    ! this.parent || ! this.parent.$el.hasClass("ep-analysis-plot")
            });
            // to accomodate all columns if there are many of them
            var proposedWidth = sizeMeta * 70;
            // min-width for each column is 70px
            this.$el.width() < proposedWidth && this.$el.width(proposedWidth);
            this.$el.append(t);
            this.updateNbRowsShown();
        },
        
        _cacheHeight: function(chunk) {
            this.chunkHeight = this.chunkTable[0].outerHeight();
            this.rowHeight = this.chunkHeight / chunk.length;
        },
        
        render: function() {
            this.renderSkeleton();
            this.renderFilters();
            var $tbody = this.$el.children(".ep-analysis-tbody");
            var $thead = this.$el.children(".ep-analysis-thead");
            this.$actionIcons = $thead.find(".ep-th-actions > i");
            $tbody.on("scroll", _.bind(this.onScroll, this));
            $tbody.scrollTop(0);
            this.eventBus.push({
                tableViewRendered: true,
                tableView: this
            });    
        },
                
        renderFilters:  function() {
            var v;
            _.each(this.model.filters, function(model, i) {
                v = new FilterView({
                    className:  "input-prepend ep-analysis-filter",
                    model:      model
                });
                v.render();
                this.filters.push(v);
            }, this);
        },
        adjustTheadWidth: function() {
            this.$el.children(".ep-analysis-thead").width(
                    this.$el.children(".ep-analysis-tbody").children().width()
                    );
        },
        /**
         * Called when height of the table needs to be adjusted based on 
         * varying amount of all rows initially or in effect of filtering
         * @param {Integer} size
         * @param {Array} initialDataChunk
         * @returns {undefined}
         */
        adjustHeight: function(size, initialDataChunk) {
            var $tbody = this.$el.children(".ep-analysis-tbody");
            $tbody.children().height(Math.ceil(size * this.rowHeight));
            $tbody.height(Math.ceil(initialDataChunk.length * this.rowHeight));
        },
                
        adjustChunkColumnWidth: function() {
            var $thead = this.$el.children(".ep-analysis-thead");
            var $theadThs = $thead.find("th");
            _.each(this.chunkTable, function($chunk) {
                $chunk.children("thead").find("th").each(function(i) {
                    $(this).css("width", $theadThs.eq(i).get(0).style.width);
                });
            });
        },
         
        makeColumnsResizable:   function() {
            function make() {
                this.$el.children(".ep-analysis-thead").resizableColumns();
            };
//            requestAnimationFrame(_.bind(make, this));
            this.$el.children(".ep-analysis-thead").resizableColumns();
        },
         
        showFilters: function(colIdx, iconEl) {
            this.hideFilters(colIdx, iconEl);
            var label = this.model.get("meta")[colIdx].label,
                nbCols = this.model.get("meta").length;
            var filters = _.filter(this.filters, function(filterView) {
                return filterView.model.get("idx") === colIdx;
            });
            $(iconEl).popover({
                html:       true,
                trigger:    "manual",
                delay:      { show: 0, hide: 500 },
                title:      "'"+label+"' values",
                placement:  colIdx === 0 ? "right" : (colIdx === nbCols-1 ? "left" : "bottom"),
                content:    _.map(filters, function(filter) {
                    return filter.$el;
                }),
                container:  this.$el
            }).popover("show");
            $(iconEl).data("popover").$tip.attr("data-id", $(iconEl).prop("id"));
            filters[0].focus();
            
        },  
        hideFilters:    function(colIdx, iconEl) {
            if ($(iconEl).data("popover")) {
                $(iconEl).popover("destroy");
            }
        },
        toggleFilters:  function(colIdx, iconEl) {
            if ($(iconEl).data("popover")) {
                this.hideFilters(colIdx, iconEl);
            }
            else {
                this.showFilters(colIdx, iconEl);
            }
        },
        showSummary: function(colIdx, labelEl) {
            var view = this,
                nbCols = this.model.get("meta").length;
            this.model.getSummary(colIdx, function(errors, result) {
                var itemsHtml = [];
                _.each(result.summary, function(occurences, value) {
                    itemsHtml.push(TemplateManager.render("ep-list-item-tmpl", {notA: true, label: value+": "+occurences}));
                });
                var listHtml = TemplateManager.render("ep-list-tmpl", {className: "unstyled", items: itemsHtml.join("")});
                var title = view.model.get("meta")[colIdx].description || 
                        view.model.get("meta")[colIdx].label;
                $(labelEl).popover({
                    html:       true,
                    title:      title,
                    placement:  colIdx === 0 ? "right" : (colIdx === nbCols-1 ? "left" : "bottom"),
                    content:    listHtml,
                    trigger:    "manual",
                    container:  view.$el
                }).popover("show");
                $(labelEl).data("popover").$tip.attr("data-id", $(labelEl).prop("id"));
            });
        },     
        hideSummary:    function(labelEl) {
            if ($(labelEl).data("popover"))
                $(labelEl).popover("destroy");
        },
        hideSummaries:  function() {
            var view = this;
            this.$el.children(".ep-analysis-thead").find(".ep-th-label").each(function() {
                view.hideSummary(this);
            });
        },
        showExtLabel:   function($el) {
            var $extLabel = $el.children(".ep-ext-label");
            if ($extLabel.width() > $el.width()) {
                $extLabel
                        .css("visibility", "visible")
                        .addClass("label");
            }
        },
        hideExtLabel:   function($el) {
            var $extLabel = $el.children(".ep-ext-label");
            $extLabel.css("visibility", "hidden");
        },
        sort:   function(colIdx, order) {
            var view = this;
            this.model.sort(colIdx, order, function(errors, result) {
                view.removeChunks();
                view.renderChunk(0, result.chunk);
            });
        },    
        updateNbRowsShown: function() {
            var filteringApplied = this.model.get("currentSize") < this.model.get("size");
            this.$el.children(".ep-table-info")
                    .find(".text-info")
                    .text(filteringApplied ? 
                        "Showing "+this.model.get("currentSize")+" of "+this.model.get("size")
                                :
                        "Showing All "+this.model.get("size"));
        },
        remove: function() {
            $(window).off("resize."+this.cid);
            this.$el.children(".ep-analysis-tbody").off("scroll");
            this.$el.children(".ep-analysis-thead").resizableColumns("destroy");
            this.trigger("before:remove");
            Backbone.View.prototype.remove.call(this);
        },
                
        onThMouseenter:  function(e) {
            var $th = $(e.currentTarget).parent();
            this.showExtLabel($th.find(".ep-th-label"));
            this.hideSummaries();
        },      
        onThMouseleave:   function(e) {
            var $th = $(e.currentTarget).parent();
            this.hideExtLabel($th.find(".ep-th-label"));
            this.hideSummaries();
        },      
        onLabelMouseenter:  function(e) {
            var $th = $(e.currentTarget).closest("th");
            this.showSummary($th.index(), $th.find(".ep-th-label"));
        },
        onLabelMouseleave:  function(e) {
            this.hideSummaries();
        },
        onActionIconMouseenter: function(e) {
            this.model.commonLocalModel.save();
            var $i = $(e.currentTarget);
            this.hideSummary($i.closest("th").find(".ep-th-label"));
            if ($i.hasClass("icon-filter")) {
                this.onFilterIconMouseenter(e);
            }
        },      
        onFilterIconMouseenter: function(e) {
            var $i = $(e.currentTarget), timer;
            timer = $i.data("timer");
            clearTimeout(timer);
            $i.data("timer", null);
        },
        onActionIconMouseleave: function(e) {
            var $i = $(e.currentTarget);
            if ($i.hasClass("icon-filter")) {
                this.onFilterIconMouseleave(e);
            }
        },
        onFilterIconMouseleave: function(e) {
            var $i = $(e.currentTarget), timer, view = this;
            timer = $i.data("timer");
            clearTimeout(timer);
            timer = setTimeout(function() {
                view.hideFilters($i.closest("th").index(), $i);
            }, 500);
            $i.data("timer", timer);
        },
        onPopoverMouseenter:  function(e) {
            var $popover = $(e.currentTarget), relatedId = $popover.attr("data-id");
            if (relatedId) {
                var timer = $("#"+relatedId).data("timer");
                clearTimeout(timer);
            }
        },
        onPopoverMouseleave: function(e) {
            var $popover = $(e.currentTarget), relatedId = $popover.attr("data-id");
            if (relatedId) {
                var $related = $("#"+relatedId), timer = $related.data("timer");
                clearTimeout(timer);
                timer = setTimeout(function() {
                    $related.popover("destroy");
                }, 500);
                $related.data("timer", timer);
            }
        },
        onActionIconClick:  function(e) {
            var $i = $(e.currentTarget),
                $th = $i.closest("th"),
                idx = $th.index();
            this.hideSummary($th.find(".ep-th-label"));
            if ($i.hasClass("icon-arrow-up") || $i.hasClass("icon-arrow-down")) {
                // make all other sort icons look inactive
                this.$actionIcons.filter(".icon-arrow-up, .icon-arrow-down").not($i).css("opacity", 0.7);
                if ($i.css("opacity") == 1) {// was already clicked last time sorting was used
                    var wasAsc = $i.hasClass("icon-arrow-up");
                    $i.removeClass("icon-arrow-up icon-arrow-down")
                            .addClass(wasAsc ? "icon-arrow-down" : "icon-arrow-up");
                }
                this.sort(idx, $i.hasClass("icon-arrow-up") ? "asc" : "desc");
                $i.css("opacity", 1);
            }
            else if ($i.hasClass("icon-filter")) {
                this.toggleFilters(idx, $i);
            }
            e.preventDefault();
        },
                
        onFilterComplete:   function(dataChunk, filterModel, rowIds) {
            this.removeChunks();
            this.renderChunk(0, dataChunk);
            this.adjustHeight(rowIds.length, dataChunk);
            this.updateNbRowsShown();
            if (filterModel) {
                this.filters[filterModel.get("i")].update();
                var $thLabel = this.$el.children(".ep-analysis-thead")
                            .find("th").eq(filterModel.get("idx"))
                            .find(".ep-th-label");
                var $filterIcon = this.$actionIcons.filter(".icon-filter")
                            .eq(filterModel.get("idx"));
                if (filterModel.has("value")) {
                    $thLabel.children().addClass("label label-info");
                    $filterIcon.css("opacity", 1);
                }
                // additionaly check for other column filters before taking away styles
                else if (! this.model.anyColumnFilterHasValue(filterModel.get("idx"))) {
                    $thLabel.children().removeClass("label label-info");
                    $filterIcon.css("opacity", 0.7);
                }
            }
        },

        onTdMouseenter: function(e) {
            var $td = $(e.currentTarget);
            this.showExtLabel($td);
        },
        onTdMouseleave: function(e) {
            var $td = $(e.currentTarget);
            this.hideExtLabel($td);
        },
                
        onMouseleave:   function() {
            this.hideSummaries();
        },
        onWindowResize: function() {
            this.adjustTheadWidth();
            requestAnimationFrame(_.bind(this.adjustChunkColumnWidth, this));
        },
        onTableColumnResized:   function() {
            requestAnimationFrame(_.bind(this.adjustChunkColumnWidth, this));
        }
    });
    return TableView;
});