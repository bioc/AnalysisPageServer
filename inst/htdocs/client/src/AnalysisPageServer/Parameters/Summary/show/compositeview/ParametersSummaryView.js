/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 * It renders parameter values as uneditable list.
 * Present at first in sidebar after loading analysis plot response.
 */
import Marionette from "marionette";
import Bacon from "bacon";
import ChildView from "./ParameterView";
import jst from "./template.html!jst";

export default Marionette.CompositeView.extend({
    template: jst,
    className: "clearfix ep-sidebar-parameter-summary",

    ui: {
        modifyBtn: "[data-modify]"
    },

    triggers: {
        "click @ui.modifyBtn": "toggle"
    },

    childView: ChildView,
    childViewContainer: "ul",
    childViewOptions(childModel) {
        return {
            isRoot: true,
            collection: childModel.children
        };
    },

    templateHelpers() {
        return {
            withModify: this.getOption("withModify")
        };
    }
});
