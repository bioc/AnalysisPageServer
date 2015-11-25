/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bootstrap"], 
    function(Marionette) {
    return Marionette.CollectionView.extend({
        tagName: "ul",
        className: "nav nav-tabs",
        
        childView: Marionette.ItemView,
        childViewOptions: function() {
            return {
                template: "#ep-analysis-array-tabs-navitem-tmpl",
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
});