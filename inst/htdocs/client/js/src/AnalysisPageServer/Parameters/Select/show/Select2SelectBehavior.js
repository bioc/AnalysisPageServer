/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "../../Select2Behavior/Select2Behavior"], 
function(Marionette, Bacon, Select2Behavior) {
    return Select2Behavior.extend({
        _select2Query: function(q) {
            function filterText(text) {
                return text && text.toLowerCase().indexOf(q.term.toLowerCase()) > -1;
            }
            function filterChoices(choices) {
                var listOfPairs = _.map(choices, function(text, val) {
                    return filterText(text) ? [val, text] : null;
                });
                return _.object(_.filter(listOfPairs, function(pair) {
                    return _.isArray(pair);
                }));
            }
            Bacon.once("void")
                    .map(this.view.model)
                    .map(".attributes.choices")
                    .map(filterChoices)
                    .map(this, "_select2MapChoices")
                    .map(this, "_updateDropdownActions")
                    .onValue(q, "callback");
        },
        _select2MapChoices: function(choices) {
            var select2Result = {
                results: _.map(choices, function(text, val) {
                    return {
                        id:   val,
                        text: text
                    };
                })
            };
            return select2Result;
        },
        _popoverContent: function() {
            return this.view.model.get("choices")[this.view.model.get("value")];
        },
        _updateDropdownActions: function(select2Results) {
            if (this.isSelectAllAllowed() || this.isDeselectAllAllowed()) {
                select2Results.results.unshift({
                    text: " "
                });
            }
            this.isSelectAllAllowed() &&
                select2Results.results.unshift({
                    id:   "action-select-all",
                    text: "Select All"
                });
            this.isDeselectAllAllowed() &&
                select2Results.results.unshift({
                    id:   "action-deselect-all",
                    text: "Deselect All"
                });
            return select2Results;
        },
        updateSelectionFromModel: function() {
            var data, value = this.view.model.get("value");
            if (this.view.model.get("allow_multiple")) {
                value = _.isArray(value) ? value : (value ? [value] : null);
                data = _.map(value, function(v, i) {
                    return {
                        id:   v,
                        text: this.view.model.get("choices")[v]
                    };
                }, this);
            }
            else {
                data = {
                    id:   value,
                    text: this.view.model.get("choices")[value]
                };
            }
            this.view.ui.field.select2("data", data);
            
            this.view.model.get("allow_multiple") || this.updatePopover();
        }
    });
});