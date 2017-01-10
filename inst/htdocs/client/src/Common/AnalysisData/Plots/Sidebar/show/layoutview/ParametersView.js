/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import AccordionGroupBehavior from "../behaviors/AccordionGroupBehavior";
import jst from "./parametersTemplate.html!jst";
import "bootstrap";

export default Marionette.LayoutView.extend({
    template: jst,

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
