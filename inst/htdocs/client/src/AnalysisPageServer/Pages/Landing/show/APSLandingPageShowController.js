/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import LandingPageView from "./layoutview/APSLandingPageView";
import AnalyticsFacade from "analytics/AnalyticsFacade";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("app:view:show-main:landing-page", this.onCommandShow, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("app:view:show-main:landing-page");
    },
    onCommandShow: function() {
        Backbone.history.navigate("");
        this._show();
    },
    show: function() {
        this._show();
    },
    _show: function() {
        var self = this;
        var pages = app.channel.request("pages:collection");
        var promise = app.channel.request("pages:fetch");
        promise.then(function() {
            var pagesInMenu = pages.getInMenu();
            var nb = _.size(pagesInMenu);
            if (nb === 0 || nb > 1) {
                // normal flow
                self._showNormal();
            }
            else {
                self._showPrimary(pagesInMenu[0]);
            }
        });
    },
    _showNormal: function() {
        var pages = app.channel.request("pages:collection");
        var pageModel = pages.get("landing");
        var self = this;
        pages.setActive(pageModel);
        AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
        var v = new LandingPageView({
            model: pageModel
        });
        var promise = app.channel.request("app:view:show-main", v, pageModel.get("label"));
        promise.then(function() {
            app.channel.request("pages:views:landing:tool-overview:initialize", v);
        });
    },
    _showPrimary: function(pageModel) {
        var self = this;
        app.channel.request("parameters:fetch", pageModel)
                .then(function() {
                    app.channel.request("app:view:show-main:primary-page", pageModel);
                });
    }
});
