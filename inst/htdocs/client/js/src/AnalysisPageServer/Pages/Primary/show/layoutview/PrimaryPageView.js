/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"], 
function(Marionette, Bacon) {
    return Marionette.LayoutView.extend({
        
        template: "#aps-primary-page-tmpl",
        
        ui: {
            caption: "[data-caption]",
            description: "[data-description]"
        },
        
        regions: {
            parameters: "[data-parameters-region]"
        },
        
        onRender: function() {
            this.$el.prop("id", this.model.get("name")+"-page-view");
        },
        
        onShowFully: function() {
            this.getChildView("parameters").triggerMethod("show:fully");
        }
    });
});