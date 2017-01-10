/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import d3 from "d3";
import d3asEventStream from "d3.bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:plot:initialize-brush-tagging", this.initializeTagging, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:plot:initialize-brush-tagging");
    },
    listenToModel: function(svgView, tableDataModel) {
        var self = this;
        this.listenTo(tableDataModel, "filter:complete", _.partial(this._onModelFilterComplete, svgView, tableDataModel));
        this.listenTo(tableDataModel, "change:newlySelected", _.partial(this._onModelChangeNewlySelected, svgView));
        this.listenTo(svgView.model, "change:tagFieldIdx", _.partial(this._onModelChangeTagFieldIdx, svgView, tableDataModel));
        tableDataModel.once("destroy", function() {
            self.stopListening(tableDataModel);
        });
        svgView.once("destroy", function() {
            self.stopListening(svgView.model);
        });
    },
    initializeTagging: function(svgView, tableDataModel) {
        this.listenToModel(svgView, tableDataModel);
        var brushEndEventStream = d3asEventStream(svgView.d3.brushFunction, "brushend.epmarqueetag");
        // Tag points in a region
        brushEndEventStream
                .takeUntil(svgView.getDestroyES())
                .filter(this, "_isTagMode", svgView.model)
                .onValue(this, "_onBrushend", svgView, tableDataModel);
        // Tag individual points
        var mouseDownEventStream =
                d3asEventStream(svgView.d3.points, "mousedown.eppointtag")
                .filter(this, "_isTagMode", svgView.model);

        mouseDownEventStream
                .takeUntil(svgView.getDestroyES())
                .map(function(e) { return {
                        id: e.target.id,
                        withPrevious: e.shiftKey
                    };
                })
                .onValue(this, "selectPoint", tableDataModel);
    },
    _isTagMode: function(model) {
        return model.get("interactionMode") === "tag";
    },
    _onBrushend: function(svgView, tableDataModel, e) {
        this.selectPointsByExtent(svgView, tableDataModel, {
            extent: e.target.extent(),
            withPrevious: e.sourceEvent.shiftKey
        });
        e.target.clear();
        e.target(svgView.d3.brush);
    },
    /**
     *
     * @param {Array} pair First element is point id.
     * The second one is boolean indicating if previous tags stay
     * @returns {undefined}
     */
    selectPoint: function(tableDataModel, data) {
        tableDataModel.setSelectedRows([data.id], data.withPrevious);
    },
    /**
     *
     * @param {Array} pair First element is extent as provided by d3.
     * The second one is boolean indicating if previous tags stay
     * @returns {undefined}
     */
    selectPointsByExtent: function(svgView, tableDataModel, data) {
        var extent = data.extent, ids = [];
        svgView.d3.points.each(function(d) {
            (!!d.startingPoint && extent[0][0] <= d.startingPoint[0] && d.startingPoint[0] < extent[1][0] &&
                        extent[0][1] <= d.startingPoint[1] && d.startingPoint[1] < extent[1][1])
                && ids.push(this.id);
        });
        tableDataModel.setSelectedRows(ids, data.withPrevious);
    },

    _onModelChangeNewlySelected: function(svgView, model, newlySelected) {
        if (_.isEqual(model.get("selected"), newlySelected)) {
            svgView.clearTagCloud();
        }
        svgView.model.set("interactionMode", "tag");
        app.channel.request("analysis-data:views:plot:d3:render-tags", svgView, model, false);
    },
    _onModelChangeTagFieldIdx: function(svgView, tableDataModel, model, tagFieldIdx) {
        model.set("tagCloudVisible", false);
        app.channel.request("analysis-data:views:plot:d3:render-tags", svgView, tableDataModel, true);
    },
    _onModelFilterComplete: function(svgView, tableDataModel) {
        if (svgView.model.get("tagCloudVisible")) {
            svgView.model.set("tagCloudVisible", false);
            app.channel.request("analysis-data:views:plot:d3:render-tags", svgView, tableDataModel, true);
        }
    }
});
