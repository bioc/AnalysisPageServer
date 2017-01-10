/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import Marionette from "marionette";
import app from "app";
import FooterView from "./itemview/FooterView";
import "velocity/velocity.ui";

export default Marionette.Controller.extend({
    initialize: function(opts) {
        this.modalC = opts.modalController;
        app.channel.reply("app:view", this.getAppView, this);
        app.channel.reply("app:view:show-main", this.showMain, this);
        app.channel.reply("app:view:show-modal", this.showModal, this);
        app.channel.reply("app:view:hide-modal", this.hideModal, this);
        app.channel.reply("app:view:initialize", this.initializeAppView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("app:view");
        app.channel.stopReplying("app:view:show-main");
        app.channel.stopReplying("app:view:show-modal");
        app.channel.stopReplying("app:view:hide-modal");
        app.channel.stopReplying("app:view:initialize");
    },
    getAppView: function() {
        return this.appView;
    },
    initializeAppView: function(appView) {
        this.appView = appView;
        appView.render();

        var footer = new FooterView();
        footer.render();
    },
    showMain: function(view, title) {
        var appView = this.appView;
        var promise;
        if (appView.getRegion("main").hasView()) {
            promise = $.Velocity.animate(appView.getRegion("main").currentView.$el, "transition.slideRightOut", {duration: 200});
        }
        else {
            promise = Promise.resolve();
        }
        var newViewAvailable = promise.then(() => {
            appView.getRegion("main").show(view);
            appView.setTitle(title + " | EP");
        });
        newViewAvailable
        .then(() => $.Velocity.animate(view.$el, "transition.slideLeftIn", {duration: 200}))
        .then(() => view.triggerMethod("show:fully"));

        return newViewAvailable;
    },
    showModal: function(opts) {
        var v = this.modalC.createView(opts);
        this.appView.showChildView("modal", v);
        return v;
    },
    hideModal: function() {
        this.appView.getRegion("modal").empty();
    }
});
