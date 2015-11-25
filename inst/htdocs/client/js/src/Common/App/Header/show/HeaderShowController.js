/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/HeaderView", "./compositeview/ToolMenuView"],
function(Marionette, HeaderView, ToolMenuView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("header:view:initialize", this.initializeHeaderView, this);
            this.getReqRes().setHandler("header:view", this.getHeaderView, this);
        },
        initializeHeaderView: function() {
            var pages = this.getReqRes().request("pages:collection");
            var env = this.getReqRes().request("app:model:env");
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
            var promise = this.getReqRes().request("pages:fetch");
            promise.then(function(pages) {
                var toolMenuView = new ToolMenuView({
                    collection: pages
                });
                toolMenuView.render();
                self.listenTo(toolMenuView, "childview:click", self._onClickTool);
            });

        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        _onClickBrand: function(args) {
            var env = this.getReqRes().request("app:model:env");
            var pages = this.getReqRes().request("pages:collection");
            if (env === "analysis-page-server-static") {
                this.getCommands().execute("apss:app:view:select-dataset", pages.at(0), true);
            }
            else {
                this.getCommands().execute("app:view:show-main:landing-page");
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
            var env = this.getReqRes().request("app:model:env");
            if (env === "analysis-page-server-static") {
                this.getCommands().execute("apss:app:view:select-dataset", itemView.model, true);
            }
            else {
                var promise = this.getReqRes().request("parameters:fetch", itemView.model);
                promise.then(function(parameters) {
                    if (parameters.size() === 0) {
                        self.getCommands().execute("app:view:show-main:analysis-page", itemView.model);
                    }
                    else {
                        self.getCommands().execute("app:view:show-main:primary-page", itemView.model);
                    }
                });
            }
        }
    });
});
