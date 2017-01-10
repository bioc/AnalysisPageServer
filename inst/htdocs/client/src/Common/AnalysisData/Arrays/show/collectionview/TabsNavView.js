/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import "bootstrap";
import itemJst from "./navItemTemplate.html!jst";

export default Marionette.CollectionView.extend({
    tagName: "ul",
    className: "nav nav-tabs",

    childView: Marionette.ItemView,
    childViewOptions: function() {
        return {
            template: itemJst,
            tagName: "li"
        };
    },

    onRender: function() {
        this.setActiveTab(this.collection.at(0));
    },

    setActiveTab: function(selectedModel) {
        this.children.each(function(child) {
            child.$el.removeClass("active");
        });
        var activeChild = this.children.findByModel(selectedModel);
        activeChild && activeChild.$el.addClass("active");
    }
});
