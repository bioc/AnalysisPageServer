/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import AccordionGroupBehavior from "../behaviors/AccordionGroupBehavior";
import jst from "./sectionTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,

    behaviors: {
        Accordion: {
            behaviorClass: AccordionGroupBehavior
        }
    },

    templateHelpers: {
        _
    }
});
