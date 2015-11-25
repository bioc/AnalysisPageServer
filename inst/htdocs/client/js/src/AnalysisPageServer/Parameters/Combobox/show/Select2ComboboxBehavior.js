/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "../../Select2Behavior/Select2Behavior"], 
function(Marionette, Bacon, Select2Behavior) {
    return Select2Behavior.extend({
        modelEvents: _.extend({}, Select2Behavior.prototype.modelEvents, {
            "fetch:suggestions:fail": "onModelFetchSuggestionsFail"
        }),
        onRender: function() {
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
        onModelFetchSuggestionsFail: function() {
            this.view.ui.field.select2("close");
        },
        onShowFully: function() {
            Select2Behavior.prototype.onShowFully.call(this);
            // ensure placeholder is visible at the beginning
            this.$(".select2-input").trigger("blur");
        },
        _select2Query: function(q) {
            this._queryBus.push(q);
        },
        _mapQuery: function(q) {
            if (this.view.model.get("selfDependent")) {
                return this._mapQuerySelfDependent(q);
            }
            else {
                return this._mapQueryNonSelfDependent(q);
            }
        },
        _mapQuerySelfDependent: function(q) {
            var same = q.term == this.view.model.get("searchTerm");
            this.view.model.set("searchTerm", q.term, {viewTriggered: true});
            // I need query.callback in the last step so pass it here
            return same ? 
                        Bacon.once({
                            query: q, 
                            suggestions: this.view.model.get("suggestions")
                        }) : 
                        Bacon.combineWith(
                            function(q, model) {
                                return {
                                    query: q,
                                    suggestions: model.get("suggestions")
                                };
                            },
                            Bacon.once(q), 
                            this.view.model.asEventStream("fetch:suggestions:success").take(1)
                        );
        },
        _mapQueryNonSelfDependent: function(q) {
            function filterSuggestions(suggestions) {
                return _.filter(suggestions, function(s) {
                    return s.long_name 
                            && s.long_name.toString().toLowerCase().indexOf(q.term.toLowerCase()) > -1;
                });
            }
            return {
                query: q,// I need query.callback in the last step so pass it here
                suggestions: filterSuggestions(this.view.model.get("suggestions"))
            };
        },
        _select2NextSearchTerm: function(data, currentSearchTerm) {
            if (this.view.model.get("selfDependent")) {
                return currentSearchTerm || this.view.model.get("searchTerm");
            }
            else {
                return "";
            }
        },
        _select2MapSuggestions: function(queryBusObj) {
            queryBusObj.select2Result = {
                results: _.map(queryBusObj.suggestions, function(s) {
                    return {
                        id:   s.id,
                        text: s.long_name
                    };
                })
            };
            
            return queryBusObj;
        },
        _select2QueryCallback: function(queryBusObj) {
            queryBusObj.query.callback(queryBusObj.select2Result);
        },
        _updateDropdownActions: function(queryBusObj) {
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
        _popoverContent: function() {
            return this.view.model.get("readable");
        },
        updateSelectionFromModel: function() {
            var data;
            if (this.view.model.get("allow_multiple")) {
                data = _.map(this.view.model.get("value"), function(v, i) {
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
            
            this.updatePopover();
        },
        getSelect2Options: function() {
            var opts = _.extend(Select2Behavior.prototype.getSelect2Options.call(this), {
                closeOnSelect:      false,
//                dropdownAutoWidth:  true,
                nextSearchTerm: _.bind(this._select2NextSearchTerm, this)
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
});