/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "./FilterModel", "./TableDataLocalModel", 
    "requirejs-web-workers!workers/TableDataWorker.js",
    "client/createClient"], 
function(Backbone, Bacon, FilterModel, TableDataLocalModel, worker, createClient) {
    
    worker.addEventListener("message", onWorkerMessage, false);
    worker.addEventListener("error", onWorkerError, false);
    
    var TableDataModel = Backbone.Model.extend({
        /**
         * Shared by all TableDataModel instances
         * @type TableDataLocalModel
         */
        commonLocalModel:   new TableDataLocalModel({
            id: "common"
        }),
        defaults:   function() {
            return {
                selected:       [],
                newlySelected:  [],
                filteredByIds:  false
            };
        },
        /**
         * 
         * @param {Object} As returned by "analysis" resource attributes
         * @param {Object} options
         * @returns {undefined}
         */
        initialize: function(attributes, options) {
            this.rClient = createClient("R");
            this.pageModel = options.pageModel;
            worker.postMessage({
                cmd:        "init",
                id:         this.cid,
                data:       options.analysis.value.data,
                meta:       options.analysis.value.meta,
                perChunk:   attributes.perChunk
            });
            this.set("id", options.pageModel.get("name")+"-"+options.analysis.name);
            var size = _.size(options.analysis.value.data);
            this.set("size", size);
            this.set("currentSize", size);
            this.prepareMeta(options.analysis.value.meta);
            this.prepareFilters();
            this.initializeLocalModel();
        },
                
        initializeLocalModel: function() {
            this.localModel = new TableDataLocalModel({
                id:   this.get("id")
            });
        },
                
        prepareMeta: function(meta) {
            var arrayMeta = _.values(meta);
            arrayMeta = _.map(arrayMeta, function(itemMeta, i) {
                itemMeta.idx = i;
                return itemMeta;
            });
            this.metaCollection = new Backbone.Collection(arrayMeta);
            this.metaCollection.each(function(metaItem) {
                this.listenTo(metaItem, "change:sortOrder", this._onColChangeSortOrder);
            }, this);
        },
        
        _onColChangeSortOrder: function(sortedMetaItem, sortOrder, opts) {
            var self = this;
            if (opts.unset) return;
            this.metaCollection.each(function(metaItem) {
                if (metaItem !== sortedMetaItem) {
                    metaItem.unset("sortOrder");
                }
            });
            this.sort(sortedMetaItem.get("idx"), sortOrder, function(error, result) {
                sortedMetaItem.trigger("sort:complete");
                self.trigger("sort:complete", result.chunk);
            });
        },
        
        prepareFilters: function() {
            var i = 0, f, filterAttrs;
            this.filtersCollection = new Backbone.Collection();
            this.metaCollection.each(function(metaItem, idx) {
                metaItem.filtersCollection = new Backbone.Collection();
                filterAttrs = {
                    idx:    idx,
                    label:  metaItem.get("label"),
                    type:   metaItem.get("type")
                };
                switch (metaItem.get("type")) {
                    case "numeric":
                    case "integer":
                        f = new FilterModel(_.extend({}, filterAttrs, {
                            i:      i++,
                            subtype: "min"
                        }));
                        this.listenTo(f, "change:value", this.onFilterChangeValue);
                        this.filtersCollection.add(f);
                        metaItem.filtersCollection.add(f);
                        f = new FilterModel(_.extend({}, filterAttrs, {
                            i:      i++,
                            subtype: "max"
                        }));
                        this.listenTo(f, "change:value", this.onFilterChangeValue);
                        this.filtersCollection.add(f);
                        metaItem.filtersCollection.add(f);
                        break;
                    default:
                        f = new FilterModel(_.extend({}, filterAttrs, {
                            i:      i++
                        }));
                        this.listenTo(f, "change:value", this.onFilterChangeValue);
                        this.filtersCollection.add(f);
                        metaItem.filtersCollection.add(f);
                        break;
                }
            }, this);
        },
                
        _getPlotUrl: function() {
            if (this.pageModel.isDataset()) {
                return this.get("plotFile");
            }
            else {
                return this.rClient.url("retrieve", null, {
                    file: this.get("plotFile")
                });
            }
        },
                
        fetchPlot:  function(opts) {
            var self = this;
            var startTime = new Date().getTime();
            var promise = this.sync("read", this, _.extend({
                url:        this._getPlotUrl(),
                dataType:   "text"
            }, opts));
            return Promise.resolve(promise).then(function(plot) {
                if (! self.pageModel.isDataset()) {
                    self.localModel.set("plotFetchMeanTime",
                        (self.localModel.get("plotFetchMeanTime")+(new Date().getTime()-startTime))/2);
                    self.localModel.save();
                }
                return plot;
            });
        },
          
        getColumnFilters: function(idx) {
            return this.filtersCollection.where({idx: idx});
        },
        
        anyColumnFilterHasValue: function(idx) {
            return _.reduce(this.getColumnFilters(idx), function(memo, filterModel) {
                return memo || filterModel.has("value");
            }, false);
        },
         
        getDataChunk: function(perChunk, chunkNo, callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:        "getDataChunk",
                id:         this.cid,
                chunkNo:    chunkNo,
                perChunk:   perChunk,
                jobId:      jobId
            });
        },
                
        sort: function(colIdx, order, callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:    "sort",
                id:     this.cid,
                colIdx: colIdx,
                order:  order,
                jobId:  jobId
            });
        },
                
        getSummary: function(colIdx, callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:    "getSummary",
                id:     this.cid,
                colIdx: colIdx,
                jobId:  jobId
            });
        },
                
        getRow: function(id, callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:    "getRow",
                id:     this.cid,
                rowId:  id,
                jobId:  jobId
            });
        },
                
        getActiveRows: function() {
            var jobId = _.uniqueId();
            var self = this;
            return new Promise(function(resolve) {
                TableDataModel.jobs[jobId] = function(err, result) {
                    resolve(result);
                };
                worker.postMessage({
                    cmd:    "getActiveRows",
                    id:     self.cid,
                    jobId:  jobId
                });
            });
            
        },
                
        setSelectedRows: function(ids, withPrevious) {
            var newSet = withPrevious ? _.union(this.get("selected"), ids) : ids;
            // I'll need this when rendering newly selected points with tags
            this.set({
                "newlySelected": _.difference(ids, this.get("selected")),
                "selected": newSet
            });
        },
                
        setAllSelected: function() {
            var self = this;
            this.getActiveRows().then(function(result) {
                self.setSelectedRows(_.map(result.rows, function(r) {
                    return r.id;
                }), true);
            });
        },
                
        filterSelected: function() {
            this.filterByIds(this.get("selected"));
        },
                
        cancelFilterSelected: function() {
            this.filterByIds(null);
        },
                
        filterByIds: function(ids) {
            var jobId = _.uniqueId(), model = this;
            worker.postMessage({
                cmd:        "filterByIds",
                id:         this.cid,
                jobId:      jobId,
                rowIds:     ids
            });
            this.set("filteredByIds", !!ids);
            TableDataModel.jobs[jobId] = function(errors, result) {
                model.set("currentSize", _.size(result.rowIds));
                model.trigger("filter:complete", result.chunk, result.rowIds);
            };
        },
                
        onFilterChangeValue: function(filterModel, value) {
            var jobId = _.uniqueId(), model = this;
            this.trigger("filter:before", filterModel);
            worker.postMessage({
                cmd:        "filter",
                id:         this.cid,
                jobId:      jobId,
                colIdx:     filterModel.get("idx"),
                value:      value,
                type:       filterModel.get("type"),
                subtype:    filterModel.get("subtype")
            });
            TableDataModel.jobs[jobId] = function(errors, result) {
                model.set("currentSize", _.size(result.rowIds));
                filterModel.trigger("filter:complete", filterModel);
                model.trigger("filter:complete", result.chunk, result.rowIds);
            };
        }
    }, {
        /**
         * Simple hash where keys are job ids and values are callbacks registered
         * @type Object
         */
        jobs:       {},
        /**
         * @type WebWorker
         */
        worker:     worker
    });
    
    function fireWorkerCallback(data) {
        if (typeof TableDataModel.jobs[data.jobId] !== "undefined") {
            TableDataModel.jobs[data.jobId].apply(null, [null, _.omit(data, ["jobId", "cmd", "id"])]);
            delete TableDataModel.jobs[data.jobId];
        }
    }
    
    function onWorkerMessage(e) {
        switch (e.data.cmd) {
            case "init":
                break;
            default:
                fireWorkerCallback(e.data);
        }
        
    };
                
    function onWorkerError(e) {

    };
    
    return TableDataModel;
});