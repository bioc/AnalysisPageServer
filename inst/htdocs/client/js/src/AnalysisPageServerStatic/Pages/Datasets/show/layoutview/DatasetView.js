/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"], 
function(Marionette, Bacon) {
    return Marionette.LayoutView.extend({
        
        template: "#apss-dataset-tmpl",
        
        ui: {
            caption: "[data-caption]"
        },
        
        regions: {
            analysis: "[data-analysis-region]"
        },
        
        modelEvents: {
            "change:label": "_onModelChangeLabel"
        },
        
        onRender: function() {
            this.$el.prop("id", this.model.get("name")+"-page-view");
        },
        onShowFully: function() {
            this.getChildView("analysis").triggerMethod("show:fully");
        },
        _onModelChangeLabel: function() {
            this.ui.caption.text(this.model.get("label"));
        }
    });
});