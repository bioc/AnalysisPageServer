/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * It renders parameter values as uneditable list.
 * Present at first in sidebar after loading analysis plot response.
 */
define(["marionette", "bacon", "./ParameterView"], 
function(Marionette, Bacon, ChildView) {
    
    return Marionette.CompositeView.extend({
        template: "#ep-parameters-summary-tmpl",
        className: "clearfix ep-sidebar-parameter-summary",
        
        ui: {
            modifyBtn: "[data-modify]"
        },
        
        triggers: {
            "click @ui.modifyBtn": "toggle"
        },
        
        childView: ChildView,
        childViewContainer: "ul",
        childViewOptions: function(childModel) {
            return {
                isRoot: true,
                collection: childModel.children
            };
        },
        
        templateHelpers: function() {
            return {
                withModify: this.getOption("withModify")
            };
        }
    });
});