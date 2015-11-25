/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/APSLandingPageView", "analytics/AnalyticsFacade"], 
function(Marionette, LandingPageView, AnalyticsFacade) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("app:view:show-main:landing-page", this.onCommandShow, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
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
            var pages = this.getReqRes().request("pages:collection");
            var promise = this.getReqRes().request("pages:fetch");
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
            var pages = this.getReqRes().request("pages:collection");
            var pageModel = pages.get("landing");
            var self = this;
            pages.setActive(pageModel);
            AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
            var v = new LandingPageView({
                model: pageModel
            });
            var promise = this.getReqRes().request("app:view:show-main", v, pageModel.get("label"));
            promise.then(function() {
                self.getCommands().execute("pages:views:landing:tool-overview:initialize", v);
            });
        },
        _showPrimary: function(pageModel) {
            var self = this;
            this.getReqRes().request("parameters:fetch", pageModel)
                    .then(function() {
                        self.getCommands().execute("app:view:show-main:primary-page", pageModel);
                    });
        }
    });
});