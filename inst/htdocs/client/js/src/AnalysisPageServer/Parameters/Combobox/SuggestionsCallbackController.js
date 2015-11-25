/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "client/createClient", "functions/fixedEncodeURIComponent"], 
function(Marionette, Bacon, createClient, fixedEncodeURIComponent) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.restClient = createClient("REST");
            this.getCommands().setHandler("parameters:combobox:suggestions:initialize", this.initializeGetSuggestionsBus, this);
            this.getCommands().setHandler("parameters:combobox:suggestions:fetch", this.run, this);
            this.getVent().on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
        },
        onDestroy: function() {
            this.getCommands().removeHandler("parameters:combobox:suggestions:initialize");
            this.getCommands().removeHandler("parameters:combobox:suggestions:fetch");
            this.getVent().off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
        },
        getVent: function() {
            return Backbone.Wreqr.radio.channel("global").vent;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        isCombobox: function(parameter) {
            return parameter.get("type") === "combobox";
        },
        anyDependencyHasOutdatedValue: function(parameter) {
            return _.some(parameter.getComboboxDependencies(), function(depParam) {
                // the self-dependent combobox shouldn't count itself here
                if (depParam === parameter) return false;
                return this.getReqRes().request("parameters:has-outdated-value", depParam);
            }, this);
        },
        everyDependencyIsSatisfied: function(parameter) {
            return _.every(parameter.getComboboxDependencies(), function(depParam) {
                if (depParam === parameter && parameter.get("selfDependent")) {
                    return depParam.get("searchTerm");
                }
                else {
                    return depParam.hasValue();
                }
            });
        },
        onDependencyChangedValue: function(parameter, opts) {
            // this might be the parameter that originally triggered a cascade 
            // of operations on parameters that depend on it
            // if it is i.e. a self-dependent combobox
            this.run(parameter, opts);
        },
        run: function(parameter, opts) {
            if (! this.isCombobox(parameter)) return;
            if (this.anyDependencyHasOutdatedValue(parameter)) return;
            if (! this.everyDependencyIsSatisfied(parameter)) return;
            opts = opts || {};
            parameter._getSuggestionsBus.push(this._buildUri(parameter));
        },
        initializeGetSuggestionsBus: function(parameter) {
            if (! this.isCombobox(parameter)) return;
            parameter._getSuggestionsBus = new Bacon.Bus();
            var suggestionsStream = 
                    parameter._getSuggestionsBus
                    .takeUntil(parameter.getDestroyES())
                    // only handle request that is different from the previous
                    // it is decided by comparing constructed URLs
                    .skipDuplicates()
                    .doAction(parameter, "trigger", "fetch:suggestions:start")
                    // if there is still running request it will be cancelled
                    .flatMapLatest(this, "_mapSuggestionsUri", parameter);
            suggestionsStream
                    .filter(_.isArray)
                    .onValue(this, "_onSuggestionsFetched", parameter);
//            suggestionsStream
//                    .filter(_.negate(_.isArray))
//                    .onValue(this, "_onSuggestionsFailed", parameter);
//            suggestionsStream
//                    .onError(this, "_onSuggestionsFailed", parameter);
        },
        _mapSuggestionsUri: function(parameter, uri) {
            var self = this;
            return Bacon.fromPromise(Promise.resolve(parameter.sync("read", parameter, {
                url:    uri
            })).catch(function(jqXHR) {
                self._onSuggestionsFailed(parameter, jqXHR);
            }), true);
//            return Bacon.fromPromise(parameter.sync("read", parameter, {
//                url:    uri
//            }), true/* abort if necessary */);
        },
        _buildUri: function(parameter) {
            var uri = parameter.get("uri");
            var dependentByNames = _.invert(parameter.get("dependent"));
            var replacement;
            uri = _.reduce(parameter.getComboboxDependencies(), function(builtUrl, depModel) {
                if (depModel === parameter && parameter.get("selfDependent")) {
                    replacement = depModel.get("searchTerm");
                }
                else {
                    replacement = depModel.getValue();
                }
                return builtUrl.replace(
                            ":"+dependentByNames[depModel.get("name")], 
                            fixedEncodeURIComponent(replacement)
                                    );
                
            }, uri, this);
            if (parameter.get("n.param")) {
                uri = uri.replace(":"+parameter.get("n.param"), 0);
            }
            return this.restClient.url(uri);
        },
        /**
         * If a suggestion is plain string it transforms it into an object.
         * Each item gets its array index added.
         * View needs original index to properly call selectItem() if 
         * suggestion list is narrowed down due to filtering of values.
         * @param {ParameterModel} parameter
         * @param {Array} suggestions
         * @returns {Array}
         */
        prepareSuggestions: function(parameter, suggestions) {
            return _.map(suggestions, function(item, i) {
                switch (parameter.get("response.type")) {
                    case "simple":
                        return {
                            i:          i,
                            id:         item,
                            long_name:  item
                        };
                    case "id-long_name-reason":
                        item.i = i;
                        return item;
                }
            }, this);
        },
        
        _onSuggestionsFetched: function(parameter, suggestions) {
            if (_.isArray(suggestions)) {
                parameter.set("suggestions", this.prepareSuggestions(parameter, suggestions));
                // trigger additional event to change:suggestions as
                // they may not have changed at all
                parameter.trigger("fetch:suggestions:success", parameter);
            }
        },
        
        _onSuggestionsFailed: function(parameter, jqXHR) {
            parameter.set("suggestions", []);
            parameter.trigger("fetch:suggestions:fail", this.restClient, jqXHR);
        }
    });
});