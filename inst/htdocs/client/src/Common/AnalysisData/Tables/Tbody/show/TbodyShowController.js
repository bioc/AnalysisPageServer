/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import TbodyView from "./itemview/TbodyView";
import Bacon from "bacon";
import "bacon.jquery";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:table:tbody", this.getView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:table:tbody");
    },
    getView: function(tableView) {
        var v = new TbodyView({
            model: tableView.model,
            tableView: tableView
        });
        this.initializeScrolling(v);
        this.listenToOnce(v, "show", this._onShow);
        return v;
    },
    initializeScrolling: function(tbodyView) {
        tbodyView.$el.asEventStream("scroll")
                .takeUntil(tbodyView.getDestroyES())
                .debounce(300)
                .flatMapLatest(this, "_mapScrollToChunkIds", tbodyView)
                .flatMap(this, "_mapToDataChunk", tbodyView)
                .onValue(this, "_renderChunk", false, tbodyView);
    },
    _mapScrollToChunkIds: function(tbodyView) {
        var scrollTop = tbodyView.$el.scrollTop(),
            possibleChunkId = parseInt(scrollTop / tbodyView.chunkHeight);
        return Bacon.fromArray(this.getUnrenderedChunkIds(tbodyView, possibleChunkId));
    },
    _mapToDataChunk: function(tbodyView, chunkId) {
        return Bacon.fromNodeCallback(tbodyView.model, "getDataChunk",
                        tbodyView.model.get("perChunk"),
                        chunkId)
                        .map(function(result) {
                            return {
                                chunkId: chunkId,
                                chunk: result.chunk
                            };
                        });
    },
    getUnrenderedChunkIds: function(tbodyView, testId) {
        var ids = [];
        if (typeof tbodyView.chunkTable[testId] === "undefined") {
            ids.push(testId);
        }
        if (testId-1 > -1 && typeof tbodyView.chunkTable[testId-1] === "undefined") {
            ids.push(testId-1);
        }
        if (typeof tbodyView.chunkTable[testId+1] === "undefined") {
            ids.push(testId+1);
        }
        return ids;
    },
    _onShow: function(tbodyView) {
        this._mapToDataChunk(tbodyView, 0)
                .onValue(this, "_renderChunk", true, tbodyView);
    },
    _renderChunk: function(isFirst, tbodyView, result) {
        if (isFirst) {
            tbodyView.renderFirstChunk(result.chunk);
        }
        else {
            tbodyView.renderChunk(result.chunkId, result.chunk);
        }
    }
});
