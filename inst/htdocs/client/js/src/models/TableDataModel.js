/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "models/FilterModel", "models/TableDataLocalModel", 
    "requirejs-web-workers!workers/TableDataWorker.js",
    "functions/saveTableDataModelAsCsv",
    "client/createClient"], 
function(Backbone, Bacon, FilterModel, TableDataLocalModel, worker, 
saveTableDataModelAsCsv, createClient) {
    
    worker.addEventListener("message", onWorkerMessage, false);
    worker.addEventListener("error", onWorkerError, false);
    
    var TableDataModel = Backbone.Model.extend({
        filters:    null,
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
                newlySelected:  []
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
            this.perChunk = options.perChunk || 30;
            worker.postMessage({
                cmd:        "init",
                id:         this.cid,
                data:       attributes.value.data,
                meta:       attributes.value.meta,
                perChunk:   this.perChunk
            });
            this.set("id", options.pageModel.get("name")+"-"+attributes.name);
            this.set("size", _.size(attributes.value.data));
            this.set("currentSize", _.size(attributes.value.data));
            this.prepareMeta(attributes.value.meta);
            this.filters = [];
            this.unset("value");
            this.createFilters();
            this.initializeLocalModel();
        },
                
        initializeLocalModel:   function() {
            this.localModel = new TableDataLocalModel({
                id:   this.get("id")
            });
        },
                
        prepareMeta:    function(meta) {
            var asArray = [];
            for (var k in meta) {
                asArray.push(meta[k]);
            }
            this.set("meta", asArray);
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
            var startTime = new Date().getTime();
            var promise = this.sync("read", this, _.extend({
                url:        this._getPlotUrl(),
                dataType:   "text"
            }, opts));
            function saveTime(tdm) {
                if (! tdm.pageModel.isDataset()) {
                    tdm.localModel.set("plotFetchMeanTime",
                        (tdm.localModel.get("plotFetchMeanTime")+(new Date().getTime()-startTime))/2);
                    tdm.localModel.save();
                }
            }
            Bacon.fromPromise(promise)
                    .onValue(saveTime, this);
            return promise;
        },
                
        createFilters:  function() {
            var f1, f2, idx = 0, i = 0;
            _.each(this.get("meta"), function(colMeta) {
                switch (colMeta.type) {
                    case "numeric":
                    case "integer":
                        f1 = new FilterModel({
                            i:      i++,
                            idx:    idx,
                            label:  colMeta.label,
                            type:   colMeta.type,
                            subtype: "min"
                        });
                        this.listenTo(f1, "change:value", this.onFilterChangeValue);
                        f2 = new FilterModel({
                            i:      i++,
                            idx:    idx,
                            label:  colMeta.label,
                            type:   colMeta.type,
                            subtype: "max"
                        });
                        this.listenTo(f2, "change:value", this.onFilterChangeValue);
                        this.filters.push(f1);
                        this.filters.push(f2);
                        break;
                    default:
                        f1 = new FilterModel({
                            i:      i++,
                            idx:    idx,
                            label:  colMeta.label,
                            type:   colMeta.type
                        });
                        this.listenTo(f1, "change:value", this.onFilterChangeValue);
                        this.filters.push(f1);
                        break;
                }
                idx++;
            }, this);
        },
         
        getColumnFilters: function(idx) {
            return _.filter(this.filters, function(filterModel) {
                return filterModel.get("idx") === idx;
            });
        },
        
        anyColumnFilterHasValue: function(idx) {
            return _.reduce(this.getColumnFilters(idx), function(memo, filterModel) {
                return memo || filterModel.has("value");
            }, false);
        },
         
        saveAsCsv:  function(filename, cb) {
            saveTableDataModelAsCsv(this, filename, cb);
        },
                
        getDataChunk:   function(chunkNo, perChunk, callback) {
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
                
        sort:      function(colIdx, order, callback) {
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
                
        getSummary:   function(colIdx, callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:    "getSummary",
                id:     this.cid,
                colIdx: colIdx,
                jobId:  jobId
            });
        },
                
        getRow:     function(id, callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:    "getRow",
                id:     this.cid,
                rowId:  id,
                jobId:  jobId
            });
        },
                
        getActiveRows:  function(callback) {
            var jobId = _.uniqueId();
            TableDataModel.jobs[jobId] = callback;
            worker.postMessage({
                cmd:    "getActiveRows",
                id:     this.cid,
                jobId:  jobId
            });
        },
                
        setSelectedRows:    function(ids, withPrevious) {
            var newSet = withPrevious ? _.union(this.get("selected"), ids) : ids;
            // I'll need this when rendering newly selected points with tags
            this.set("newlySelected", _.difference(ids, this.get("selected")));
            this.set("selected", newSet);
        },
                
        filterSelected: function() {
            this.filterByIds(this.get("selected"));
        },
                
        cancelFilterSelected:  function() {
            this.filterByIds(null);
        },
                
        filterByIds:    function(ids) {
            var jobId = _.uniqueId(), model = this;
            worker.postMessage({
                cmd:        "filterByIds",
                id:         this.cid,
                jobId:      jobId,
                rowIds:     ids
            });
            TableDataModel.jobs[jobId] = function(errors, result) {
                model.set("currentSize", _.size(result.rowIds));
                model.trigger("filter:complete", result.chunk, null, result.rowIds);
            };
        },
                
        onFilterChangeValue:    function(filter, value) {
            var jobId = _.uniqueId(), model = this;
            this.trigger("filter:before", filter);
            worker.postMessage({
                cmd:        "filter",
                id:         this.cid,
                jobId:      jobId,
                colIdx:     filter.get("idx"),
                value:      value,
                type:       filter.get("type"),
                subtype:    filter.get("subtype")
            });
            TableDataModel.jobs[jobId] = function(errors, result) {
                model.set("currentSize", _.size(result.rowIds));
                model.trigger("filter:complete", result.chunk, filter, result.rowIds);
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