/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import BaseBehavior from "../behaviors/ParameterBehavior";
import jst from "./arrayTemplate.html!jst";

export default Marionette.CompositeView.extend({
    template: jst,
    className: "control-group control-array-group light-blue",

    childViewContainer: "[data-children-region]",

    getChildView(childModel) {
        return app.channel.request("parameters:views:class", childModel);
    },

    childViewOptions(childModel, idx) {
        return _.extend(
                app.channel.request("parameters:views:options", childModel, this),
                {
                    arrayChild: {
                        labelIsNumber: true,
                        idx: idx
                    }
                }
                );
    },

    ui: {
        addBtn: ".ep-array-add-child",
        removeBtn: ".ep-array-remove-child"
    },

    triggers: {
        "click @ui.addBtn": "click:add-btn",
        "click @ui.removeBtn": "click:remove-btn"
    },

    collectionEvents: {
        "add": "onAddChild",
        "remove": "onRemoveChild"
    },

    behaviors: {
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    initialize() {
        app.channel.request("parameters:views:array:listen-to", this);
    },

    templateHelpers() {
        return app.channel.request("parameters:views:template-helpers", this);
    },
    onRender() {
        this.updateButtons();
    },
    onShowFully() {
        this.children.invoke("triggerMethod", "show:fully");
    },
    updateButtons() {
        if (this.model.get("min") == this.model.get("max")) {
            this.ui.addBtn.hide();
            this.ui.removeBtn.hide();
        }
        else {
            this.ui.addBtn.prop("disabled", this.model.isMax());
            this.ui.removeBtn.prop("disabled", this.model.isMin());
        }
    },
    onAddChild(childModel) {
        this.updateButtons();
    },
    onRemoveChild(childModel) {
        this.updateButtons();
    }
});
