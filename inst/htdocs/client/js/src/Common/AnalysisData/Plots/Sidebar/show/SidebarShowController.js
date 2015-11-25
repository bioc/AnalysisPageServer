/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/SidebarView", "./itemview/WarningsView",
    "./layoutview/ParametersView", "./compositeview/FiltersView",
    "./itemview/TaggingView"], 
    function(Marionette, SidebarView, WarningsView, ParametersView, 
    FiltersView, TaggingView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:views:plot:sidebar", this.getView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getView: function(plotView, settingsModel) {
            var env = this.getReqRes().request("app:model:env");
            var v = new SidebarView({
                template: "#"+
                        (env === "analysis-page-server-static" ? "apss-" : "aps-")+
                        "analysis-plot-sidebar-tmpl",
                model: plotView.model
            });
            this.listenToOnce(v, "render", _.partial(this._onRender, settingsModel));
            return v;
        },
        _onRender: function(settingsModel, sidebarView) {
            var env = this.getReqRes().request("app:model:env");
            if (env !== "analysis-page-server-static") {
                this.renderWarnings(sidebarView);
                this.renderParameters(sidebarView);
            }
            this.renderFilters(sidebarView);
            this.renderTagging(sidebarView, settingsModel);
        },
        renderWarnings: function(sidebarView) {
            if (! sidebarView.model.get("warnings")) return;
            var self = this;
            var warnings = sidebarView.model.get("warnings");
            warnings = _.isArray(warnings) ? warnings : [warnings];
            if (_.size(warnings) < 1) return;
            warnings = _.map(warnings, function(warning) {
                return {warning: warning};
            });
            var v = new WarningsView({
                el: sidebarView.$el.children("[data-warnings-el]"),
                collection: new Backbone.Collection(warnings)
            });
            v.$el.removeClass("hide");
            v.once("destroy", function() {
                self.stopListening(v);
            });
            sidebarView.once("destroy", function() {
                v.destroy();
            });
            v.render();
//            sidebarView.getRegion("warnings").show(v);
            return v;
        },
        renderParameters: function(sidebarView) {
            var self = this;
            var pages = this.getReqRes().request("pages:collection");
            var activePage = pages.getActive();
            var v = new ParametersView({
                el: sidebarView.$el.children("[data-parameters-el]"),
                opened: ! sidebarView.model.get("warnings")// warnings take precedence
            });
            v.once("destroy", function() {
                self.stopListening(v);
            });
            sidebarView.once("destroy", function() {
                v.destroy();
            });
            var summaryView = this.getReqRes().request("parameters:views:summary", activePage.rootParameters, true);
            summaryView.on("toggle", function() {
                self._onParametersSummaryToggle(v, activePage);
            });
            v.render();
//            sidebarView.getRegion("parameters").show(v);
            v.getRegion("inner").show(summaryView);
        },
        renderFilters: function(sidebarView) {
            var self = this;
            var v = new FiltersView({
                el: sidebarView.$el.children("[data-filters-el]"),
                model: sidebarView.model,
                collection: sidebarView.model.metaCollection
            });
            v.once("destroy", function() {
                self.stopListening(v);
            });
            sidebarView.once("destroy", function() {
                v.destroy();
            });
            v.render();
//            sidebarView.getRegion("filters").show(filtersView);
            return v;
        },
        renderTagging: function(sidebarView, settingsModel) {
            var v = new TaggingView({
                el: sidebarView.$el.children("[data-tagging-el]"),
                model: settingsModel,
                collection: sidebarView.model.metaCollection
            });
            v.on("tag:all", function() {
                sidebarView.model.setAllSelected();
            });
            v.on("tag:clear", function() {
                sidebarView.model.setSelectedRows([], false);
            });
            v.on("tag:filter", function() {
                sidebarView.model.filterSelected();
            });
            v.on("tag:release", function() {
                sidebarView.model.cancelFilterSelected();
            });
            v.on("accordion:toggle", function(open) {
                open && settingsModel.set("interactionMode", "tag");
            });
            sidebarView.once("destroy", function() {
                v.destroy();
            });
            v.render();
//            sidebarView.getRegion("tagging").show(v);
        },
        _onParametersSummaryToggle: function(parametersView, pageModel) {
            var v = this.getReqRes().request("parameters:views:form", {
                model: pageModel,
                collection: pageModel.rootParameters,
                type: "secondary"
            });
            this.getCommands().execute("parameters:views:form:listen-to", v);
            parametersView.showChildView("inner", v);
            v.triggerMethod("show:fully");
        }
    });
});