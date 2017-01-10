/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import Select2Behavior from "../../Select2Behavior/Select2Behavior";

export default Select2Behavior.extend({
    _select2Query(q) {
        function filterText(text) {
            return text && text.toLowerCase().indexOf(q.term.toLowerCase()) > -1;
        }
        function filterChoices(choices) {
            var listOfPairs = _.map(choices, (text, val) => filterText(text) ? [val, text] : null);
            return _.object(_.filter(listOfPairs, pair => _.isArray(pair)));
        }
        Bacon.once("void")
                .map(this.view.model)
                .map(".attributes.choices")
                .map(filterChoices)
                .map(this, "_select2MapChoices")
                .map(this, "_updateDropdownActions")
                .onValue(q, "callback");
    },
    _select2MapChoices(choices) {
        var select2Result = {
            results: _.map(choices, (text, val) => {
                return {
                    id:   val,
                    text: text
                };
            })
        };
        return select2Result;
    },
    _updateDropdownActions(select2Results) {
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
    updateSelectionFromModel() {
        var data, value = this.view.model.get("value");
        if (this.view.model.get("allow_multiple")) {
            value = _.isArray(value) ? value : (value ? [value] : null);
            data = _.map(value, (v, i) => {
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
    }
});
