/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/AccordionGroupBehavior", "bootstrap"], 
function(Marionette, AccordionGroupBehavior) {
    return Marionette.LayoutView.extend({
        template: "#ep-analysis-plot-sidebar-parameters-tmpl",
        
        regions: {
            inner: "[data-inner-region]"
        },
        
        behaviors: {
            Accordion: {
                behaviorClass: AccordionGroupBehavior
            }
        },
        
        templateHelpers: function() {
            return {
                opened: this.getOption("opened")
            };
        }
    });
});