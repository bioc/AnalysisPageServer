/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon"], function(Backbone, Bacon) {
    var PageView = Backbone.View.extend({
        initialize: function(opts) {
            this.createPageView = opts.createPageView;
            this.appView = opts.appView;
            this.appModel = this.appView.model;
            this.eventBus = opts.eventBus;
            this.perChunk = opts.perChunk;
            this.children = [];
            this.$el.prop("id", this.model.get("name")+"-page-view");
            this.$el.addClass("ep-page-row");
            this.initializeReactiveProperties();
        },
        initializeReactiveProperties:   function() {
            var beforeRemoveES = this.asEventStream("before:remove");
            var animationEndES = this.$el
                    .asEventStream("animationend webkitAnimationEnd MSAnimationEnd")
                    .takeUntil(beforeRemoveES);
            animationEndES
                    .filter(this.$el, "hasClass", "fadeInLeft")
                    .doAction(this, "show")
                    .doAction(this.eventBus, "push", {
                        pageViewShown:  true,
                        pageView:       this
                    })
                    .onValue(this, "trigger", "shown");
            animationEndES
                    .filter(this.$el, "hasClass", "fadeOutRight")
                    .doAction(this, "trigger", "before:remove")
                    .doAction(this, "remove")
                    .doAction(this, "trigger", "after:remove")
                    .onValue(this.eventBus, "push", {
                        pageViewRemoved:    true,
                        pageView:           this
                    });
                    
        },
        isHidden:   function() {
            return this.$el.hasClass("hide");
        },
        isShown: function() {
            return ! this.$el.hasClass("fadeInLeft") && ! this.$el.hasClass("fadeOutRight");
        },
        show:   function() {
            this.$el.removeClass("hide animated fadeOutRight fadeInLeft");
        },
        hide:   function() {
            this.$el.removeClass("animated fadeOutRight fadeInLeft").addClass("hide");
        },
        removeWithAnimation:    function() {
            this.$el.removeClass("fadeInLeft").addClass("animated fadeOutRight");
        },
        showWithAnimation:    function() {
            this.$el.removeClass("fadeOutRight").addClass("animated fadeInLeft");
        },
        remove: function() {            
            _.each(this.children, function(child) {
                child.remove();
            });
            Backbone.View.prototype.remove.call(this);
        }
    });
    return PageView;
});