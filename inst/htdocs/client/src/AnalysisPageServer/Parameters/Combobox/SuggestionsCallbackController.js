/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";
import createClient from "client/createClient";
import fixedEncodeURIComponent from "functions/fixedEncodeURIComponent";

export default Marionette.Object.extend({
    initialize() {
        this.restClient = createClient("REST");
        app.channel.reply("parameters:combobox:suggestions:initialize", this.initializeGetSuggestionsBus, this);
        app.channel.reply("parameters:combobox:suggestions:fetch", this.run, this);
        app.channel.on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    onDestroy() {
        app.channel.stopReplying("parameters:combobox:suggestions:initialize");
        app.channel.stopReplying("parameters:combobox:suggestions:fetch");
        app.channel.off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    isCombobox(parameter) {
        return parameter.get("type") === "combobox";
    },
    anyDependencyHasOutdatedValue(parameter) {
        return _.some(parameter.getComboboxDependencies(), depParam => {
            // the self-dependent combobox shouldn't count itself here
            if (depParam === parameter) return false;
            return app.channel.request("parameters:has-outdated-value", depParam);
        }, this);
    },
    everyDependencyIsSatisfied(parameter) {
        return _.every(parameter.getComboboxDependencies(), depParam => {
            if (depParam === parameter && parameter.get("selfDependent")) {
                return depParam.get("searchTerm");
            }
            else {
                return depParam.hasValue();
            }
        });
    },
    onDependencyChangedValue(parameter, opts) {
        // this might be the parameter that originally triggered a cascade
        // of operations on parameters that depend on it
        // if it is i.e. a self-dependent combobox
        this.run(parameter, opts);
    },
    run(parameter, opts) {
        if (! this.isCombobox(parameter)) return;
        if (this.anyDependencyHasOutdatedValue(parameter)) return;
        if (! this.everyDependencyIsSatisfied(parameter)) return;
        opts = opts || {};
        parameter._getSuggestionsBus.push(this._buildUri(parameter));
    },
    initializeGetSuggestionsBus(parameter) {
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
                .flatMapLatest(this, "_mapSuggestionsUri", parameter)
                .onValue(this, "_onSuggestionsFetched", parameter);
    },
    _makeRequest(parameter, uri, timeout, nbRetries) {
        return Promise.resolve(parameter.sync("read", parameter, {
            url:    uri
        }))
        // return Promise.reject({responseText: "BLABLABLA"})// emulate HTTP error
        // return Promise.resolve("no JSON array response") // emulate different kind of response
        .then(suggestions => this._checkResponse(suggestions))
        .catch(xhr => this._handleRequestError(parameter, uri, xhr, timeout, nbRetries));
    },
    _checkResponse(response) {
        if (_.isArray(response)) {
            return response;
        }
        else {
            return Promise.reject({
                responseText: "The server response is not a JSON array:\n\n"+response
            });
        }
    },
    _handleRequestError(parameter, uri, xhr, timeout, nbRetries) {
        if (nbRetries == 0) {
            return this._onSuggestionsFailed(parameter, xhr);
        }
        else {
            return new Promise((resolve, reject) =>
                setTimeout(
                    () => resolve(this._makeRequest(parameter, uri, timeout, nbRetries - 1)),
                    timeout
                ));
        }
    },
    _mapSuggestionsUri(parameter, uri) {
        parameter.isLoadingSuggestions(true);
        return Bacon.fromPromise(this._makeRequest(parameter, uri, 200, 3), true);
    },
    _buildUri(parameter) {
        var uri = parameter.get("uri");
        var dependentByNames = _.invert(parameter.get("dependent"));
        var replacement;
        uri = _.reduce(parameter.getComboboxDependencies(), (builtUrl, depModel) => {
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
    prepareSuggestions(parameter, suggestions) {
        return _.map(suggestions, (item, i) => {
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

    _onSuggestionsFetched(parameter, suggestions) {
        parameter.isLoadingSuggestions(false);
        parameter.set("suggestions", this.prepareSuggestions(parameter, suggestions));
        // trigger additional event to change:suggestions as
        // they may not have changed at all
        parameter.trigger("fetch:suggestions:success", parameter);
    },

    _onSuggestionsFailed(parameter, xhr) {
        parameter.isLoadingSuggestions(false);
        parameter.set("suggestions", []);
        parameter.trigger("fetch:suggestions:fail", parameter.getLastSuggestionsUrl(), xhr);
    }
});
