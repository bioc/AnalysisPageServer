/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./itemview/FooterView", 
    "velocity.ui"], 
function(Marionette, FooterView) {
    return Marionette.Controller.extend({
        initialize: function(opts) {
            this.modalC = opts.modalController;
            this.getReqRes().setHandler("app:view", this.getAppView, this);
            this.getReqRes().setHandler("app:view:show-main", this.showMain, this);
            this.getReqRes().setHandler("app:view:show-modal", this.showModal, this);
            this.getCommands().setHandler("app:view:hide-modal", this.hideModal, this);
            this.getCommands().setHandler("app:view:initialize", this.initializeAppView, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
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
            var newViewAvailable = promise.then(function() {
                appView.getRegion("main").show(view);
                appView.setTitle(title);
            });
            newViewAvailable.then(function() {
                return $.Velocity.animate(view.$el, "transition.slideLeftIn", {duration: 200});
            }).then(function() {
                view.triggerMethod("show:fully");
            });
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
});