/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import ArrayListView from "./collectionview/ArrayListView";
import ArrayTabsView from "./layoutview/ArrayTabsView";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:array", this.getView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:array");
    },
    _prepareAnalysisData: function(analysisData) {
        var items = [];
        _.each(analysisData, itemData => {
            items.push(_.clone(itemData));
            delete itemData.value;
        });
        var dataCollection = new Backbone.Collection(analysisData);
        _.each(items, (item, i) => {
            dataCollection.at(i).analysisData = item;
        });
        return dataCollection;
    },
    getView: function(analysis, options) {
        options = options || {};
        var dataCollection = this._prepareAnalysisData(analysis.value);
        delete analysis.value;
        var dataModel = new Backbone.Model(analysis);
        if (! options.isRoot) {
            var v = new ArrayListView(_.extend({}, options, {
                model: dataModel,
                collection: dataCollection
            }));
        }
        else {
            var v = new ArrayTabsView(_.extend({}, options, {
                model: dataModel,
                collection: dataCollection,
                className: "tabbable"
            }));
        }
        v.once("render", () => this._onViewRender(v));
        return v;
    },
    _onViewRender: function(view) {
        if (view.getOption("isRoot")) {
            app.channel.request("analysis-data:views:array:tabs:initialize", view);
        }
        else {
            app.channel.request("analysis-data:views:array:list:initialize", view);
        }
    }
});
