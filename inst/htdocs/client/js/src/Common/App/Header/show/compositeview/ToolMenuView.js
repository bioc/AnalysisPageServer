/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../itemview/ToolItemView", "bootstrap"],
function(Marionette, ToolItemView) {
    return Marionette.CompositeView.extend({
        template: false,
        el: "#ep-header-tools-menu",

        childView: ToolItemView,
        childViewContainer: "ul",

        ui: {
            menuToggler: "a.dropdown-toggle"
        },

        events: {
            "activate": "_onScrollspyActivate"
        },

        collectionEvents: {
            "add": "onCollectionChange",
            "remove": "onCollectionChange",
            "reset": "onCollectionChange"
        },

        onCollectionChange: function() {
            this.updateVisibility();
        },

        onRender: function() {
            this.$el.prop("id", "ep-header-tools-menu");
            this.ui.menuToggler.dropdown();
            this.updateVisibility();
        },

        filter: function(pageModel) {
            return pageModel.get("in_menu");
        },

        updateVisibility: function() {
            var visible = _.size(this.collection.getInMenu()) >= 2;
            this.$el[visible ? "show" : "hide"]();
        },

        // CompositeView can't be template-less - thus overwriting method
        _renderTemplate: function() {
            this.bindUIElements();
            return;
        },

        _onScrollspyActivate: function(e) {
            // avoid catching IE's "activate" event here
            // in Bootstrap 3 event names are namespaced
            if (! e.originalEvent) {
                this.$el.removeClass("active");// unnecessary addition from scrollspy
                this.collection.setActive(
                        this.collection.at(
                            this.$(".dropdown-menu > li.active").index()
                        )
                    );
            }
        }
    });
});
