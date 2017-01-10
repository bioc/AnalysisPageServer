/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Sortable from "Sortable";
import ExpandableTextBehavior from "Common/Behaviors/ExpandableTextBehavior";
import "bootstrap";
import "select2";
import "select2/select2.css!less";
import "select2-bootstrap-css/select2-bootstrap.css!less";
import "./ep-select2-no-spinner.css!less";

export default Marionette.Behavior.extend({
    behaviors() {
        return {
            ExpandableText: {
                behaviorClass: ExpandableTextBehavior,
                mode: "popover",
                popoverContainer: "body",
                // ensure only singular comboboxes are covered
                // ui.this.ui.expandableTextTrigger is still a selector when behaviors()
                // is invoked
                triggerSelector: this.ui.expandableTextTrigger
            }
        };
    },

    ui: {
        expandableTextTrigger: ".select2-choice .select2-chosen",
        select2Choices: "ul.select2-choices"
    },

    events: {
        // ui.field is taken from the View instance
        "change @ui.field": "onSelect2Change",
        "select2-selecting @ui.field": "onSelect2Selecting",
        "select2-opening @ui.field": "onSelect2Opening",
        "update @ui.select2Choices": "onSortableUpdate"
    },

    modelEvents: {
        "change:value": "onModelChangeValue"
    },

    onRender() {
        this.view.ui.field.select2(this.getSelect2Options());
        // need it to properly find Select2 elements created just above
        this.view.bindUIElements();
        this.view.model.get("allow_multiple") && this.initializeSortable();
        this.updateSelectionFromModel();
    },
    onShowFully() {

    },
    onBeforeDestroy() {
        this.view.ui.field.select2("destroy");
        this.sortable && this.sortable.destroy();
    },
    onModelChangeValue(model, value, opts) {
        opts.unset && this.reset();
        this.updateSelectionFromModel();
    },
    onSelect2Change(e) {
        this.view._setModelValue(e);
    },
    onSelect2Opening(e) {
        // communicate with ExpandableTextBehavior to hide expanded element
        // useful in scenarios when Bahavior's standard event handlers are insufficient,
        // like Firefox not firing mouseleave when Select2 shows mask
        // see also EXPRESSIONPLOT-1050
        this.view.triggerMethod("ExpandableTextHide", {
            triggerElement: this.ui.expandableTextTrigger
        });
    },
    onSelect2Selecting(e) {
        this._actOnDropdownActions(e);
    },
    onSortableUpdate(e) {
        this.view.ui.field.select2("onSortEnd");
    },
    initializeSortable() {
        // ui.select2Choices does not exists prior Select2 initialization
        this.sortable = new Sortable(this.ui.select2Choices[0]);
    },
    getSelect2Options() {
        return {
            multiple:       this.view.model.get("allow_multiple"),
            query:          _.bind(this._select2Query, this),
            placeholder:    this.view.model.get("prompt"),
            closeOnSelect:  ! this.view.model.get("allow_multiple"),
            formatResult:   _.bind(this._select2FormatResult, this),
            separator:      "|_NO_AUTO_SEPARATOR_|",
            transformVal:  _.bind(this._select2TransformVal, this)
        };
    },
    _select2TransformVal(val) {
        // default implementation trims value - EXPRESSIONPLOT-474
        return val;
    },
    _select2FormatResult(choice) {
        if (! choice.id && choice.text === " ") return "<hr/>";
        return choice.text;
    },
    _actOnDropdownActions(e) {
        if (e.choice.id === "action-select-all") {
            // this action is available for the multiple
            e.preventDefault();
            this.view.model.selectAll();
            this.updateSelectionFromModel();
            this.view.ui.field.select2("close");
        }
        else if (e.choice.id === "action-deselect-all") {
            // this action is available for the multiple
            e.preventDefault();
            this.view.model.deselectAll();
            this.view.ui.field.select2("close");
        }
        else if (! this.view.model.get("allow_multiple") &&
                    e.choice.id == this.view.model.getValue()) {
            // model is not notified of setting a value because a "change"
            // event on view is not fired if values are the same
            this.reset();
        }
    },
    isSelectAllAllowed() {
        var s = this.view.model.get(this.getOption("optionsAttribute"));
        return this.view.model.get("allow_multiple")
                        && _.size(s) > 1
                        && _.size(s) !== _.size(this.view.model.get("value"));
    },
    isDeselectAllAllowed() {
        return this.view.model.get("allow_multiple")
                        && _.size(this.view.model.get("value")) > 1;
    },
    reset() {
        this.view.ui.field.select2("val", "");
    }
});
