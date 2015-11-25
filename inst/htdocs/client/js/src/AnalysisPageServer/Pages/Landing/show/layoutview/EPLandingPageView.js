/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], 
function(Marionette) {
    return Marionette.LayoutView.extend({
        
        template: "#ep-landing-page-tmpl",
        
        ui: {
            
        },
        
        regions: {
            toolOverview: "[data-tool-overview-region]",
            studyForm: "[data-study-form-region]",
            projectsTable: "[data-projects-table-region]"
        },
        
        onRender: function() {
            this.$el.prop("id", this.model.get("name")+"-page-view");
        },
        
        onShowFully: function() {
            this.getRegion("toolOverview").currentView.triggerMethod("show:fully");
        }
    });
});