/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./collectionview/ArrayListView", "./layoutview/ArrayTabsView"], 
function(Marionette, ArrayListView, ArrayTabsView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:array", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        _prepareAnalysisData: function(analysisData) {
            var items = [];
            _.each(analysisData, function(itemData) {
                items.push(_.clone(itemData));
                delete itemData.value;
            });
            var dataCollection = new Backbone.Collection(analysisData);
            _.each(items, function(item, i) {
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
            this.listenToOnce(v, "render", this._onViewRender);
            return v;
        },
        _onViewRender: function(view) {
            if (view.getOption("isRoot")) {
                this.getCommands().execute("analysis-data:views:array:tabs:initialize", view);
            }
            else {
                this.getCommands().execute("analysis-data:views:array:list:initialize", view);
            }
        }
    });
});