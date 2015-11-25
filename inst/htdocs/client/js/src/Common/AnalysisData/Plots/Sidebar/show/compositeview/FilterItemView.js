/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bootstrap"], 
function(Marionette) {
    return Marionette.CompositeView.extend({
        template: "#ep-analysis-plot-sidebar-filters-item-tmpl",
        tagName: "li",
        
        getChildView: function() {
            return this.getReqRes().request("analysis-data:views:table:filter:class");
        },
        childViewContainer: "[data-filters-region]",
        childViewOptions: {
            className: "input-prepend ep-analysis-filter"
        },
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        }
        
    });
});