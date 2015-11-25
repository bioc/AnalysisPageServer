/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"], 
function(Marionette, Bacon) {
    return Marionette.LayoutView.extend({
        
        template: "#aps-landing-page-tmpl",
        
        ui: {
            
        },
        
        regions: {
            toolOverview: "[data-tool-overview-region]"
        },
        
        onRender: function() {
            this.$el.prop("id", this.model.get("name")+"-page-view");
        },
        
        onShowFully: function() {
            this.getRegion("toolOverview").currentView.triggerMethod("show:fully");
        }
    });
});