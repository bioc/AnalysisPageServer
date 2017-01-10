/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import ParentView from "./SelectParameterView";
import BaseBehavior from "../../../show/behaviors/ParameterBehavior";
import bjq from "bacon.jquery";
import jst from "./radioTemplate.html!jst";

export default ParentView.extend({

    template: jst,

    ui: {
        fields: "[type=radio]"
    },

    behaviors: {
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    initialize() {
        ParentView.prototype.initialize.apply(this, arguments);
    },

    initializeDomEventStreams() {
        var actualValueProp = bjq.radioGroupValue(this.ui.fields);
        actualValueProp
                .takeUntil(this.getDestroyES())
                .onValue(this, "_setModelValue");
    },

    onRender() {
        this.initializeDomEventStreams();
    },

    _onModelChangeValue(model) {
        var $field = this.ui.fields.filter(function() {
            return $(this).val() == model.get("value");
        });
        $field.prop("checked", true);
    }
});
