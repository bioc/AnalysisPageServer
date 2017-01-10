/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import ParentView from "./SelectParameterView";
import Select2Behavior from "../Select2SelectBehavior";
import BaseBehavior from "../../../show/behaviors/ParameterBehavior";
import jst from "AnalysisPageServer/Parameters/show/itemview/textTemplate.html!jst";

export default ParentView.extend({

    template: jst,

    ui: {
        field: "input"
    },

    behaviors: {
        Select2: {
            behaviorClass: Select2Behavior,
            optionsAttribute: "choices"
        },
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    initialize() {
        ParentView.prototype.initialize.apply(this, arguments);
    },

    _setModelValue(e) {
        this.model.setValue(e.val, {viewTriggered: true});
    },

    onShowFully() {

    }
});
