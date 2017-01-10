/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Bacon from "bacon";
import app from "app";
import FilterModel from "./FilterModel";
import TableDataLocalModel from "./TableDataLocalModel";
import createClient from "client/createClient";


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
        app.channel.request("table-data:worker:register-job", {
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
        arrayMeta = _.map(arrayMeta, (itemMeta, i) => {
            itemMeta.idx = i;
            return itemMeta;
        });
        this.metaCollection = new Backbone.Collection(arrayMeta);
        this.metaCollection.each(metaItem => {
            this.listenTo(metaItem, "change:sortOrder", this._onColChangeSortOrder);
        });
    },

    _onColChangeSortOrder: function(sortedMetaItem, sortOrder, opts) {
        if (opts.unset) return;
        this.metaCollection.each(metaItem => {
            if (metaItem !== sortedMetaItem) {
                metaItem.unset("sortOrder");
            }
        });
        this.sort(sortedMetaItem.get("idx"), sortOrder, (error, result) => {
            sortedMetaItem.trigger("sort:complete");
            this.trigger("sort:complete", result.chunk);
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
        var startTime = new Date().getTime();
        var promise = this.sync("read", this, _.extend({
            url:        this._getPlotUrl(),
            dataType:   "text"
        }, opts));
        return Promise.resolve(promise).then(plot => {
            if (! this.pageModel.isDataset()) {
                this.localModel.set("plotFetchMeanTime",
                    (this.localModel.get("plotFetchMeanTime")+(new Date().getTime()-startTime))/2);
                this.localModel.save();
            }
            return plot;
        });
    },

    getColumnFilters: function(idx) {
        return this.filtersCollection.where({idx: idx});
    },

    anyColumnFilterHasValue: function(idx) {
        return _.reduce(this.getColumnFilters(idx), (memo, filterModel) => {
            return memo || filterModel.has("value");
        }, false);
    },

    getDataChunk: function(perChunk, chunkNo, callback) {
        app.channel.request("table-data:worker:register-job", {
            cmd:        "getDataChunk",
            id:         this.cid,
            chunkNo:    chunkNo,
            perChunk:   perChunk
        }, callback);
    },

    sort: function(colIdx, order, callback) {
        app.channel.request("table-data:worker:register-job", {
            cmd:    "sort",
            id:     this.cid,
            colIdx: colIdx,
            order:  order
        }, callback);
    },

    getSummary: function(colIdx, callback) {
        app.channel.request("table-data:worker:register-job", {
            cmd:    "getSummary",
            id:     this.cid,
            colIdx: colIdx
        }, callback);
    },

    getRow: function(id, callback) {
        app.channel.request("table-data:worker:register-job", {
            cmd:    "getRow",
            id:     this.cid,
            rowId:  id
        }, callback);
    },

    getActiveRows: function() {
        return new Promise(resolve => {
            app.channel.request("table-data:worker:register-job", {
                cmd:    "getActiveRows",
                id:     this.cid
            }, (err, result) => resolve(result));
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
        this.getActiveRows().then(result => {
            this.setSelectedRows(_.map(result.rows, r => r.id), true);
        });
    },

    filterSelected: function() {
        this.filterByIds(this.get("selected"));
    },

    cancelFilterSelected: function() {
        this.filterByIds(null);
    },

    filterByIds: function(ids) {
        app.channel.request("table-data:worker:register-job", {
            cmd:        "filterByIds",
            id:         this.cid,
            rowIds:     ids
        }, (err, result) => {
            this.set("currentSize", _.size(result.rowIds));
            this.trigger("filter:complete", result.chunk, result.rowIds);
        });
        this.set("filteredByIds", !!ids);
    },

    onFilterChangeValue: function(filterModel, value) {
        this.trigger("filter:before", filterModel);
        app.channel.request("table-data:worker:register-job", {
            cmd:        "filter",
            id:         this.cid,
            colIdx:     filterModel.get("idx"),
            value:      value,
            type:       filterModel.get("type"),
            subtype:    filterModel.get("subtype")
        }, (err, result) => {
            this.set("currentSize", _.size(result.rowIds));
            filterModel.trigger("filter:complete", filterModel);
            this.trigger("filter:complete", result.chunk, result.rowIds);
        });
    }
});

export default TableDataModel;
