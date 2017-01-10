/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import HeaderView from "./layoutview/HeaderView";
import ToolMenuView from "./compositeview/ToolMenuView";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("header:view:initialize", this.initializeHeaderView, this);
        app.channel.reply("header:view", this.getHeaderView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("header:view:initialize");
        app.channel.stopReplying("header:view");
    },
    initializeHeaderView: function() {
        var pages = app.channel.request("pages:collection");
        var env = app.channel.request("app:model:env");
        this.headerView = new HeaderView({
            fixedTop: env === "analysis-page-server-static"
        });
        this.headerView.render();
        this.initializeToolMenu();
        this.listenTo(this.headerView, "click:brand", this._onClickBrand);
        this.listenTo(pages, "page:activate", this._onPageActivate);
    },
    getHeaderView: function() {
        return this.headerView;
    },
    initializeToolMenu: function() {
        var self = this;
        var headerView = this.headerView;
        var promise = app.channel.request("pages:fetch");
        promise.then(function(pages) {
            var toolMenuView = new ToolMenuView({
                collection: pages
            });
            toolMenuView.render();
            self.listenTo(toolMenuView, "childview:click", self._onClickTool);
        });

    },
    _onClickBrand: function(args) {
        var env = app.channel.request("app:model:env");
        var pages = app.channel.request("pages:collection");
        if (env === "analysis-page-server-static") {
            app.channel.request("apss:app:view:select-dataset", pages.at(0), true);
        }
        else {
            app.channel.request("app:view:show-main:landing-page");
        }
    },
    _onPageActivate: function(prev, current) {
        var self = this;
        prev && this.stopListening(prev, "change:label");
        this.headerView.setSubtitle(current.get("hidden") ? "" : current.get("label"));
        this.listenTo(current, "change:label", function() {
            self.headerView.setSubtitle(current.get("hidden") ? "" : current.get("label"));
        });
    },
    _onClickTool: function(itemView) {
        var self = this;
        var env = app.channel.request("app:model:env");
        if (env === "analysis-page-server-static") {
            app.channel.request("apss:app:view:select-dataset", itemView.model, true);
        }
        else {
            var promise = app.channel.request("parameters:fetch", itemView.model);
            promise.then(function(parameters) {
                if (parameters.size() === 0) {
                    app.channel.request("app:view:show-main:analysis-page", itemView.model);
                }
                else {
                    app.channel.request("app:view:show-main:primary-page", itemView.model);
                }
            });
        }
    }
});
