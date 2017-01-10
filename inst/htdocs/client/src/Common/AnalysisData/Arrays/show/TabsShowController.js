/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import TabsContentView from "./collectionview/TabsContentView";
import TabsNavView from "./collectionview/TabsNavView";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("analysis-data:views:array:tabs:initialize", this.initializeView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("analysis-data:views:array:tabs:initialize");
    },
    initializeView: function(tabsView) {
        var self = this;
        var navView = new TabsNavView({
            collection: tabsView.collection
        });
        var contentViewColl = new Backbone.Collection([tabsView.collection.at(0)]);
        var contentView = new TabsContentView({
            collection: contentViewColl,
            pageModel: tabsView.getOption("pageModel")
        });
        this.listenTo(tabsView, "click:tab", this._onClickTab);
        tabsView.once("destroy", function() {
            self.stopListening(tabsView);
        });
        tabsView.getRegion("nav").show(navView);
        tabsView.getRegion("content").show(contentView);
    },

    _onClickTab: function(args) {
        var contentViewColl = args.view.getChildView("content").collection;
        args.view.getChildView("nav").setActiveTab(args.selectedModel);
        if (! contentViewColl.get(args.selectedModel) && args.selectedModel) {
            contentViewColl.add(args.selectedModel, {
                at: args.index
            });
        }
        args.view.getChildView("content").setActiveTab(args.selectedModel);
    }
});
