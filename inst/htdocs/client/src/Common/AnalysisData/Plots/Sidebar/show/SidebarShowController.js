/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import SidebarView from "./layoutview/SidebarView";
import ParametersView from "./layoutview/ParametersView";
import FiltersView from "./compositeview/FiltersView";
import TaggingView from "./itemview/TaggingView";
import CustomSectionView from "./itemview/CustomSectionView";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:sidebar", this.getView, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:sidebar");
    },
    getView(plotView, settingsModel) {
        var env = app.channel.request("app:model:env");
        var v = new SidebarView({
            model: plotView.model
        });
        v.once("render", () => this._onRender(settingsModel, v));
        return v;
    },
    _onRender(settingsModel, sidebarView) {
        var env = app.channel.request("app:model:env");
        if (env !== "analysis-page-server-static") {
            this.renderParameters(sidebarView);
            this.renderWarnings(sidebarView);
        }
        this.renderFilters(sidebarView);
        this.renderTagging(sidebarView, settingsModel);
        this.renderCustomSections(sidebarView);
    },
    renderWarnings(sidebarView) {
        if (! sidebarView.model.get("warnings")) return;
        var warnings = sidebarView.model.get("warnings");
        warnings = _.isArray(warnings) ? warnings : [warnings];
        if (_.size(warnings) < 1) return;
        warnings = _.map(warnings, warning => {
            return {content: warning};
        });
        var $el = $("<div data-warnings-el class='accordion-group'></div>");
        sidebarView.$el.prepend($el);
        var v = new CustomSectionView({
            el: $el,
            collection: new Backbone.Collection(warnings),
            templateHelpers: {
                isWarning: true,
                title: "Warnings"
            }
        });
        v.once("destroy", () => this.stopListening(v));
        sidebarView.once("destroy", () => v.destroy());
        v.render();
        return v;
    },
    renderParameters(sidebarView) {
        var pages = app.channel.request("pages:collection");
        var activePage = pages.getActive();
        var $el = $("<div data-parameters-el class='accordion-group'></div>");
        sidebarView.$el.prepend($el);
        var v = new ParametersView({
            el: $el,
            opened: ! sidebarView.model.get("warnings")// warnings take precedence
        });
        v.once("destroy", () => this.stopListening(v));
        sidebarView.once("destroy", () => v.destroy());
        var summaryView = app.channel.request("parameters:views:summary", activePage.rootParameters, true);
        summaryView.once("toggle", () => this._onParametersSummaryToggle(v, activePage));
        v.render();

        v.getRegion("inner").show(summaryView);
    },
    renderFilters(sidebarView) {
        var v = new FiltersView({
            el: sidebarView.$el.children("[data-filters-el]"),
            model: sidebarView.model,
            collection: sidebarView.model.metaCollection
        });
        v.once("destroy", () => this.stopListening(v));
        sidebarView.once("destroy", () => v.destroy());
        v.render();
//            sidebarView.getRegion("filters").show(filtersView);
        return v;
    },
    renderTagging(sidebarView, settingsModel) {
        var v = new TaggingView({
            el: sidebarView.$el.children("[data-tagging-el]"),
            model: settingsModel,
            collection: sidebarView.model.metaCollection,
            tableDataModel: sidebarView.model
        });
        v.on("tag:all", () => sidebarView.model.setAllSelected());
        v.on("tag:clear", () => sidebarView.model.setSelectedRows([], false));
        v.on("tag:filter", () => sidebarView.model.filterSelected());
        v.on("tag:release", () => sidebarView.model.cancelFilterSelected());
        v.on("accordion:toggle", open => open && settingsModel.set("interactionMode", "tag"));
        sidebarView.once("destroy", () => v.destroy());
        v.render();
    },
    renderCustomSections(sidebarView) {
        var secs = sidebarView.model.get("customSections");
        if (! _.isObject(secs)) return;
        _.each(secs, (lines, title) => {
            this.renderCustomSection(sidebarView, false, title, lines);
        });

    },
    renderCustomSection(sidebarView, isWarning, title, lines) {
        var $el = $("<div data-custom-el class='accordion-group'></div>");
        sidebarView.$el.append($el);
        if (_.isString(lines)) lines = [lines];
        var items = _.map(lines, line => {
            return {
                content: line
            };
        });
        var v = new CustomSectionView({
            el: $el,
            collection: new Backbone.Collection(items),
            templateHelpers: {
                isWarning: isWarning,
                title: title
            }
        });
        v.render();
        sidebarView.once("destroy", () => v.destroy());
    },
    _onParametersSummaryToggle(parametersView, pageModel) {
        var v = app.channel.request("parameters:views:form", {
            model: pageModel,
            collection: pageModel.rootParameters,
            type: "secondary"
        });
        app.channel.request("parameters:views:form:listen-to", v);
        parametersView.showChildView("inner", v);
        v.triggerMethod("show:fully");
    }
});
