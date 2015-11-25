/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "Sortable", "select2", "bootstrap"], 
function(Marionette, Sortable) {
    return Marionette.Behavior.extend({
        modelEvents: {
            "change:value": "onModelChangeValue"
        },
        onRender: function() {
            this.view.ui.field.select2(this.getSelect2Options());
            this.view.model.get("allow_multiple") && this.initializeSortable();
            this.updateSelectionFromModel();
            this.initializeDomEventStreams();
        },
        onShowFully: function() {
            this.view.model.get("allow_multiple") || this.initializePopover();
        },
        onBeforeDestroy: function() {
            this.$(".select2-container").popover("destroy");
            this.view.ui.field.select2("destroy");
            this.sortable && this.sortable.destroy();
        },
        onModelChangeValue: function(model, value, opts) {
            opts.unset && this.reset();
            this.updateSelectionFromModel();
        },
        initializeSortable: function() {
            var $choiceContainer = this.$("ul.select2-choices");
            this.sortable = new Sortable($choiceContainer[0]);
            $choiceContainer.asEventStream("update")
                    .takeUntil(this.view.getDestroyES())
                    .onValue(this.view.ui.field, "select2", "onSortEnd");
        },
        initializeDomEventStreams: function() {
            this.$el.asEventStream("change", "#"+this.view.cid)
                    .takeUntil(this.view.getDestroyES())
                    .onValue(this.view, "_setModelValue");
            this.$el.asEventStream("select2-selecting", "#"+this.view.cid)
                    .takeUntil(this.view.getDestroyES())
                    .onValue(this, "_actOnDropdownActions");
        },
        initializePopover: function() {
            if (! this._isPopoverNecessary()) return;
            this.$(".select2-container").popover({
                title:     this.view.model.get("label"),
                content:   _.bind(this._popoverContent, this),
                trigger:   "hover",
                placement: "top"
            });
        },
        updatePopover: function() {
            this.$(".select2-container").popover("destroy");
            this.initializePopover();
        },
        _isPopoverNecessary: function() {
            var $testSpan = $("<span></span>");
            $testSpan.css({
                position: "absolute",
                visibility: "hidden",
                overflow: "visible"
            });
            $testSpan.text(this._popoverContent());
            this.$(".select2-choice").append($testSpan);
            var result = $testSpan.width() - 10 > this.$(".select2-chosen").width();
            $testSpan.remove();
            
            return result;
        },
        getSelect2Options: function() {
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
        _select2TransformVal: function(val) {
            // default implementation trims value - EXPRESSIONPLOT-474
            return val;
        },
        _select2FormatResult: function(choice) {
            if (! choice.id && choice.text === " ") return "<hr/>";
            return choice.text;
        },
        _actOnDropdownActions: function(e) {
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
        isSelectAllAllowed: function() {
            var s = this.view.model.get(this.getOption("optionsAttribute"));
            return this.view.model.get("allow_multiple") 
                            && _.size(s) > 1 
                            && _.size(s) !== _.size(this.view.model.get("value"));
        },
        isDeselectAllAllowed: function() {
            return this.view.model.get("allow_multiple") 
                            && _.size(this.view.model.get("value")) > 1;
        },
        reset: function() {
            this.view.ui.field.select2("val", "");
        }
    });
});