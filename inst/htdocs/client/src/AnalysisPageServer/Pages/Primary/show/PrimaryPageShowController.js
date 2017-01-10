/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import config from "config";
import PrimaryPageView from "./layoutview/PrimaryPageView";
import AnalyticsFacade from "analytics/AnalyticsFacade";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("app:view:show-main:primary-page", this.onCommandShow, this);
    },
    onDestroy() {
        app.channel.stopReplying("app:view:show-main:primary-page");
    },
    onCommandShow(pageModel) {
        Backbone.history.navigate("page/"+encodeURIComponent(pageModel.get("name"))+"/primary");
        this._show(pageModel.get("name"));
    },
    show(pageName, paramJsonString) {
        var promise = app.channel.request("pages:fetch");
        var self = this;
        promise
        .then(pages => app.channel.request("parameters:fetch", pages.get(pageName)))
        .then(() => this._show(pageName));
    },
    _show(pageName) {
        var pages = app.channel.request("pages:collection");
        var pageModel = pages.get(pageName);
        pages.setActive(pageModel);
        AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
        var v = new PrimaryPageView({
            model: pageModel
        });
        var promise = app.channel.request("app:view:show-main", v, pageModel.get("label"));
        var formView = app.channel.request("parameters:views:form", {
            model: pageModel,
            collection: pageModel.rootParameters,
            type: "primary"
        });
        app.channel.request("parameters:views:form:listen-to", formView);
        promise
        .then(() => v.getRegion("parameters").show(formView))
        .catch(e => config["log.debug.messages"] && console.debug(e));
    }
});
