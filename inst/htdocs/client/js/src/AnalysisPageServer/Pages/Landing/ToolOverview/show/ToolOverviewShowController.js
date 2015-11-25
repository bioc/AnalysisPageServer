/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", 
    "./layoutview/ToolOverviewView",
    "./itemview/ToolOverviewBodyView", "./itemview/ToolOverviewListView"], 
function(Marionette, ToolOverviewView,
ToolOverviewBodyView, ToolOverviewListView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands()
                    .setHandler("pages:views:landing:tool-overview:initialize", 
                        this.initializeToolOverview, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        initializeToolOverview: function(pageView) {
            var self = this;
            var v = new ToolOverviewView();
            pageView.getRegion("toolOverview").show(v);
            var promise = this.getReqRes().request("pages:fetch");
            promise.then(function(pages) {
                var menuPages = new Backbone.Collection(pages.where({in_menu: true}));
                var listView = new ToolOverviewListView({
                    collection: menuPages
                });
                var bodyView = new ToolOverviewBodyView({
                    collection: menuPages
                });
                self.listenTo(listView, "click:item", self._onToolOverviewClickItem);
                self.listenTo(listView, "mouseenter:item", _.partial(self._onToolOverviewMouseenterItem, bodyView));
                listView.once("destroy", function() {
                    self.stopListening(listView);
                });
                self.listenTo(bodyView, "click:item", self._onToolOverviewClickItem);
                bodyView.once("destroy", function() {
                    self.stopListening(bodyView);
                });
                v.getRegion("list").show(listView);
                v.getRegion("body").show(bodyView);
                listView.markFirstItemActive();
            });
            
        },
        _onToolOverviewClickItem: function(pageName) {
            var self = this;
            var pages = this.getReqRes().request("pages:collection");
            var pageModel = pages.get(pageName);
            var promise = this.getReqRes().request("parameters:fetch", pageModel);
            promise.then(function(parameters) {
                if (parameters.size() === 0) {
                    self.getCommands().execute("app:view:show-main:analysis-page", pageModel);
                }
                else {
                    self.getCommands().execute("app:view:show-main:primary-page", pageModel);
                }
            });
        },
        _onToolOverviewMouseenterItem: function(bodyView, pageName) {
            bodyView.showDesc(pageName);
        }
    });
});