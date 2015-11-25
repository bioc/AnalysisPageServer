/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.ItemView.extend({
        template: "#ep-list-item-tmpl",
        tagName: "li",
        
        ui: {
            link: "a"
        },
        
        triggers: {
            "click": {
                event: "click",
                stopPropagation: false
            }
        },
        
        modelEvents: {
            "change:active": "_onModelChangeActive",
            "change:label": "_onModelChangeLabel"
        },
        
        onRender: function() {
            // scrollspy attribute
            var relatedElId = "#"+this.model.get("name")+"-page-view";
            this.ui.link.attr("href", relatedElId);
            this.setActive(this.model.get("active"));
        },
        
        templateHelpers: function() {
            return {
                notA: false,
                strong: false,
                id: false
            };
        },
        
        setActive: function(active) {
            this.$el[active ? "addClass" : "removeClass"]("active");
        },
        
        _onModelChangeActive: function(model, active) {
            this.setActive(active);
        },
        _onModelChangeLabel: function() {
            this.ui.link.text(this.model.get("label"));
        }
    });
});