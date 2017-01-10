/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import BaseBehavior from "../behaviors/ParameterBehavior";
import jst from "./compoundTemplate.html!jst";

export default Marionette.CompositeView.extend({
    template: jst,
    className: "control-group control-compound-group light-blue",

    childViewContainer: "[data-children-region]",

    getChildView(childModel) {
        return app.channel.request("parameters:views:class", childModel);
    },

    childViewOptions(childModel, idx) {
        return _.extend(
                app.channel.request("parameters:views:options", childModel, this),
                {
                    compoundChild: {
                        idx: idx
                    }
                }
                );
    },

    behaviors: {
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    onShowFully() {
        this.children.invoke("triggerMethod", "show:fully");
    },

    templateHelpers() {
        return app.channel.request("parameters:views:template-helpers", this);
    }
});
