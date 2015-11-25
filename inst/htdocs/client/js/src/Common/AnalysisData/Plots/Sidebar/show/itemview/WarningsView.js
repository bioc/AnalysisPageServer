/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/AccordionGroupBehavior"], 
function(Marionette, AccordionGroupBehavior) {
    return Marionette.ItemView.extend({
        template: "#ep-analysis-plot-sidebar-warnings-tmpl",
        
        behaviors: {
            Accordion: {
                behaviorClass: AccordionGroupBehavior
            }
        }
    });
});