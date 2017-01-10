/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import Select2Behavior from "../../Select2Behavior/Select2Behavior";

export default Select2Behavior.extend({
    modelEvents: _.extend({}, Select2Behavior.prototype.modelEvents, {
        "fetch:suggestions:success": "onModelFetchSuggestionsSuccess",
        "fetch:suggestions:fail": "onModelFetchSuggestionsFail"
    }),
    onRender() {
        Select2Behavior.prototype.onRender.call(this);
        this._queryBus = new Bacon.Bus();
        this._queryBus
                .takeUntil(this.view.getDestroyES())
                .debounce(this.view.model.get("delay.ms") || 300)
                .flatMapLatest(this, "_mapQuery")
                .map(this, "_select2MapSuggestions")
                .map(this, "_updateDropdownActions")
                .onValue(this, "_select2QueryCallback");
        if (! this.view.model.get("selfDependent")) {
            this.view.model.getSuggestions();
        }
    },
    onBeforeDestroy() {
        this._queryBus && this._queryBus.end();
        Select2Behavior.prototype.onBeforeDestroy.call(this);
    },
    onModelFetchSuggestionsFail() {
        this.view.ui.field.select2("close");
    },
    onModelFetchSuggestionsSuccess() {
        // refresh results if user has opened the non-self dependent dropdown
        // while it is loading
        if (! this.view.model.get("selfDependent") && this.view.ui.field.select2("opened")) {
            this.view.ui.field.select2("close");
            this.view.ui.field.select2("open");
        }
    },
    onShowFully() {
        Select2Behavior.prototype.onShowFully.call(this);
        // ensure placeholder is visible at the beginning
        this.$(".select2-input").trigger("blur");
    },
    _select2Query(q) {
        this._queryBus.push(q);
    },
    _mapQuery(q) {
        if (this.view.model.get("selfDependent")) {
            return this._mapQuerySelfDependent(q);
        }
        else {
            return this._mapQueryNonSelfDependent(q);
        }
    },
    _mapQuerySelfDependent(q) {
        var same = q.term == this.view.model.get("searchTerm");
        this.view.model.set("searchTerm", q.term, {viewTriggered: true});
        // I need query.callback in the last step so pass it here
        return same ?
                    Bacon.once({
                        query: q,
                        suggestions: this.view.model.get("suggestions")
                    }) :
                    Bacon.combineWith(
                        (q, model) => {
                            return {
                                query: q,
                                suggestions: model.get("suggestions")
                            };
                        },
                        Bacon.once(q),
                        Bacon.fromEvent(this.view.model, "fetch:suggestions:success").take(1)
                    );
    },
    _mapQueryNonSelfDependent(q) {
        function filterSuggestions(suggestions) {
            return _.filter(suggestions, s => s.long_name
                        && s.long_name.toString().toLowerCase().indexOf(q.term.toLowerCase()) > -1
            );
        }
        return {
            query: q,// I need query.callback in the last step so pass it here
            suggestions: filterSuggestions(this.view.model.get("suggestions"))
        };
    },
    _select2NextSearchTerm(data, currentSearchTerm) {
        if (this.view.model.get("selfDependent")) {
            return this.view.model.get("searchTerm");
        }
        else {
            return "";
        }
    },
    _select2MapSuggestions(queryBusObj) {
        queryBusObj.select2Result = {
            results: _.map(queryBusObj.suggestions, s => {
                return {
                    id:   s.id,
                    text: s.long_name
                };
            })
        };

        return queryBusObj;
    },
    _select2QueryCallback(queryBusObj) {
        queryBusObj.query.callback(queryBusObj.select2Result);
    },
    _select2FormatNoMatches(term) {
        return this.view.model.isLoadingSuggestions() ? "Waiting for server..." : "No matches found";
    },
    _updateDropdownActions(queryBusObj) {
        if (this.isSelectAllAllowed() || this.isDeselectAllAllowed()) {
            queryBusObj.select2Result.results.unshift({
                text: " "
            });
        }
        this.isSelectAllAllowed() &&
            queryBusObj.select2Result.results.unshift({
                id:   "action-select-all",
                text: "Select All"
            });
        this.isDeselectAllAllowed() &&
            queryBusObj.select2Result.results.unshift({
                id:   "action-deselect-all",
                text: "Deselect All"
            });

        return queryBusObj;
    },
    updateSelectionFromModel() {
        var data;
        if (this.view.model.get("allow_multiple")) {
            data = _.map(this.view.model.get("value"), (v, i) => {
                return {
                    id:   v,
                    text: this.view.model.get("readable")[i]
                };
            }, this);

        }
        else {
            data = {
                id:   this.view.model.get("value"),
                text: this.view.model.get("readable")
            };
        }

        this.view.ui.field.select2("data", this.view.model.hasValue() ? data : null);
    },
    getSelect2Options() {
        var opts = _.extend(Select2Behavior.prototype.getSelect2Options.call(this), {
            closeOnSelect:      false,
//                dropdownAutoWidth:  true,
            nextSearchTerm: _.bind(this._select2NextSearchTerm, this),
            formatNoMatches: _.bind(this._select2FormatNoMatches, this)
        });
        if (this.view.model.get("selfDependent")) {
            opts = _.extend(opts, {
                containerCssClass: this.view.getOption("type") === "landing" ? "" : "input-xlarge",
                minimumInputLength: 2
            });
        }
        return opts;
    }
});
