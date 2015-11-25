/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/PrimaryPageView", "analytics/AnalyticsFacade"], 
function(Marionette, PrimaryPageView, AnalyticsFacade) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("app:view:show-main:primary-page", this.onCommandShow, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        onCommandShow: function(pageModel) {
            Backbone.history.navigate("page/"+encodeURIComponent(pageModel.get("name"))+"/primary");
            this._show(pageModel.get("name"));
        },
        show: function(pageName, paramJsonString) {
            var promise = this.getReqRes().request("pages:fetch");
            var self = this;
            promise.then(function(pages) {
                return self.getReqRes().request("parameters:fetch", pages.get(pageName));
            }).then(_.bind(this._show, this, pageName));
        },
        _show: function(pageName) {
            var pages = this.getReqRes().request("pages:collection");
            var pageModel = pages.get(pageName);
            pages.setActive(pageModel);
            AnalyticsFacade.trackPageview(pageModel.get("label"), window.location.hash);
            var v = new PrimaryPageView({
                model: pageModel
            });
            var promise = this.getReqRes().request("app:view:show-main", v, pageModel.get("label"));
            var formView = this.getReqRes().request("parameters:views:form", {
                model: pageModel,
                collection: pageModel.rootParameters,
                type: "primary"
            });
            this.getCommands().execute("parameters:views:form:listen-to", formView);
            promise.then(function() {
                v.getRegion("parameters").show(formView);
            })
            .catch(function(e) {
                console.log(e);
            });
        }
    });
});