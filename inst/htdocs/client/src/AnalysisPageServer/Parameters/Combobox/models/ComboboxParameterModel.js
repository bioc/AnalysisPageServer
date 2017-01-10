/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Bacon from "bacon";
import app from "app";
import ParameterModel from "AnalysisPageServer/Parameters/models/ParameterModel";

export default ParameterModel.extend({

    defaults() {
        return {
            value: null
        };
    },

    initialize() {
        ParameterModel.prototype.initialize.apply(this, arguments);
        app.channel.request("parameters:combobox:suggestions:initialize", this);
        this.on({
            "change:suggestions": this.onChangeSuggestions,
            "fetch:suggestions:fail": this.onFetchSuggestionsFail
        });
        this.on("fetch:suggestions:start", url => this.set("lastSuggestionsUrl", url));
    },

    /* fetch one more to see if there are any
     * @see EXPRESSIONPLOT-105
     * @see EXPRESSIONPLOT-185
     * UPDATE: fetch all of the results - if performance problems
     * occur, refine the list population with dynamic loading
     * on scrolling for example
     */
    getSuggestions() {
        app.channel.request("parameters:combobox:suggestions:fetch", this);
    },
    /*
     * Select2 depends heavily on callbacks and thus such methods are necessary
     * in the context of them. Modern codebase is event-driven and maintains
     * minimum state.
     */
    isLoadingSuggestions(flag) {
        if (! _.isUndefined(flag)) {
            this.set("_isLoading", flag);
        }
        else {
            return this.get("_isLoading");
        }
    },

    getLastSuggestionsUrl() {
        return this.get("lastSuggestionsUrl");
    },

    _toJSONMapper(mode, attributes, isActive) {
        var isSimple = ! attributes || (attributes && attributes.length === 1),
            json;
        if (! isActive) return void 0;
        if (isSimple) {
            if (mode === "url") {
                json = {
                    v:   this.getValue(),
                    r:   this.get("readable")
                };
                if (this.get("selfDependent")) json.s = this.get("searchTerm");
            }
            else {
                json = this.getValue();
            }
        }
        return json;
    },
    conditionalToJSON(mode, attributes) {
        return this.isActive()
                .take(1)
                .map(this, "_toJSONMapper", mode, attributes);
    },
    fromJSON(json, attributes, opts) {
        /*
         * @see EXPRESSIONPLOT-589
         * handle "json" which is string (value only)
         */
        if (! json) return;
        var isSimple = ! attributes || (attributes && attributes.length === 1);
        if (isSimple) {
            /*
             * @see EXPRESSIONPLOT-589
             * handle "json" which is incomplete JSON ("v" is present)
             */
            if (_.isObject(json)) {
                if (json.r) {
                    this.set("readable", json.r);
                }
                else {
                    this.set("readable", json.v);
                }
                this.setValue(json.v, opts);
                // I need a separate event that always fires unlike change:value;
                // this event is caught by the router if the json is provided by the URL
                this.trigger("value:from:json", this, json.v);
            }
            else {// is string
                this.set("readable", json);
                this.setValue(json, opts);
                this.trigger("value:from:json", this, json);
            }
        }
        else {
            _.each(attributes, attr => {
                this.set(attr, json[attr]);
            }, this);
        }
    },

    reset() {
        this.unsetValue();
        this.unset("readable");
        this.unset("suggestions");
        if (this.get("selfDependent")) this.unset("searchTerm");
    },

    destroy() {
        this.stopListening();// required to avoid orphaned self-dependent-listeners
        ParameterModel.prototype.destroy.call(this);
    },

    getDependenciesNames() {
        var deps = ParameterModel.prototype.getDependenciesNames.call(this);
        deps = deps.concat(this.getComboboxDependenciesNames());
        return _.uniq(deps);
    },
    getComboboxDependenciesNames() {
        return _.values(this.get("dependent"));
    },
    getComboboxDependencies() {
        if (this._comboboxDependenciesCache) {
            return this._comboboxDependenciesCache;
        }
        var depNames = this.getComboboxDependenciesNames();
        this._comboboxDependenciesCache = _.map(depNames, depName => {
            return app.channel.request("parameters:get-closest", this, {name: depName});
        }, this);
        return this._comboboxDependenciesCache;
    }
});
