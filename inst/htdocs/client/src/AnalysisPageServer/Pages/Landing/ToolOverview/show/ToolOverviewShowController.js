/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Backbone from "backbone";
import app from "app";
import ToolOverviewView from "./layoutview/ToolOverviewView";
import ToolOverviewBodyView from "./itemview/ToolOverviewBodyView";
import ToolOverviewListView from "./itemview/ToolOverviewListView";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("pages:views:landing:tool-overview:initialize",
                    this.initializeToolOverview, this);
    },
    onDestroy() {
        app.channel.stopReplying("pages:views:landing:tool-overview:initialize");
    },
    initializeToolOverview(pageView) {
        var v = new ToolOverviewView();
        pageView.getRegion("toolOverview").show(v);
        var promise = app.channel.request("pages:fetch");
        promise.then(pages => {
            var menuPages = new Backbone.Collection(pages.where({in_menu: true}));
            var listView = new ToolOverviewListView({
                collection: menuPages
            });
            var bodyView = new ToolOverviewBodyView({
                collection: menuPages
            });
            listView.on("click:item", pageName => this._onToolOverviewClickItem(pageName));
            // this.listenTo(listView, "click:item", this._onToolOverviewClickItem);
            listView.on("mouseenter:item", pageName => this._onToolOverviewMouseenterItem(bodyView, pageName));
            // this.listenTo(listView, "mouseenter:item", _.partial(self._onToolOverviewMouseenterItem, bodyView));
            // listView.once("destroy", () => {
            //     this.stopListening(listView);
            // });
            bodyView.on("click:item", pageName => this._onToolOverviewClickItem(pageName));
            // self.listenTo(bodyView, "click:item", self._onToolOverviewClickItem);
            // bodyView.once("destroy", function() {
            //     self.stopListening(bodyView);
            // });
            v.getRegion("list").show(listView);
            v.getRegion("body").show(bodyView);
            listView.markFirstItemActive();
        });

    },
    _onToolOverviewClickItem(pageName) {
        var pages = app.channel.request("pages:collection");
        var pageModel = pages.get(pageName);
        var promise = app.channel.request("parameters:fetch", pageModel);
        promise.then(parameters => {
            if (parameters.size() === 0) {
                app.channel.request("app:view:show-main:analysis-page", pageModel);
            }
            else {
                app.channel.request("app:view:show-main:primary-page", pageModel);
            }
        });
    },
    _onToolOverviewMouseenterItem(bodyView, pageName) {
        bodyView.showDesc(pageName);
    }
});
