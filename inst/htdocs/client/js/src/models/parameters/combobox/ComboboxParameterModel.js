/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "models/parameters/ParameterModel",
"client/createClient"], function(Backbone, Bacon, ParameterModel, createClient) {
    
    var ComboboxParameterModel = ParameterModel.extend({

        initialize:     function() {
            this.restClient = createClient("REST");
            this.initializeGetSuggestionsBus();
            ParameterModel.prototype.initialize.apply(this, arguments);
            var depNames = _.values(this.get("dependent"));
            this.set("externallyDependent", depNames.length > 0);
            this.on({
                "change:suggestions":   this.onChangeSuggestions
            });
        },
        _timeShiftedInitialize: function() {
            ParameterModel.prototype._timeShiftedInitialize.call(this);
            this._listenToExternalDependencies();
//            this.areDependenciesMet(true) && this.getSuggestions();
        },
        initializeGetSuggestionsBus: function() {
            this._getSuggestionsBus = new Bacon.Bus();
            var suggestionsStream = 
                    this._getSuggestionsBus
                    .takeUntil(this.getDestroyES())
                    // only handle request that is different from the previous
                    // it is decided by comparing constructed URLs
                    .skipDuplicates()
                    .doAction(this, "trigger", "fetch:suggestions:start")
                    // if there is still running request it will be cancelled
                    .flatMapLatest(this, "_mapSuggestionsUri");
            suggestionsStream
                    .onValue(this, "_onSuggestionsFetched");
            suggestionsStream
                    .onError(this, "_onSuggestionsFailed");
        },
        
        _mapSuggestionsUri: function(uri) {
            return Bacon.fromPromise(this.sync("read", this, {
                url:    uri
            }), true/* abort if necessary */);
        },
        
        _onSuggestionsFetched: function(suggestions) {
            this.set("suggestions", this.prepareSuggestions(suggestions));
            // trigger additional event to change:suggestions as
            // they may not have changed at all
            this.trigger("fetch:suggestions:success", this);
        },
        
        _onSuggestionsFailed: function(jqXHR) {
            this.set("suggestions", []);
            this.trigger("fetch:suggestions:fail", this.restClient, jqXHR);
        },
        
        _listenToExternalDependencies:     function() {
            _.each(this.get("dependent"), function(name, urlName) {
                if (! (this.get("selfDependent") && this.get("name") === name)) {
                    // can be a few with the same name in the form
                    var dep = this.getClosestWithName(name);
                    this.listenTo(dep, "change:value", this.onDependencyValueChanged);
                }
            }, this);
//            this.areDependenciesMet() && this.getSuggestions();
        },
        areDependenciesMet: function(includeSelf) {
            return _.reduce(this.get("dependent"), function(depsMet, name) {
                // can be a few with the same name in the form
                var dep = this.getClosestWithName(name);
                if (dep === this) {
                    if (includeSelf) 
                        return depsMet && dep.hasValue();
                    else 
                        return depsMet;
                }
                else {
                    return depsMet && dep.hasValue();
                }
            }, true, this);
        },
                
        prepareUri: function() {
            var uri = this.get("uri");
            _.each(this.get("dependent"), function(name, urlName) {          
                var dep = this.getClosestWithName(name);
                if (this.get("selfDependent") && name === this.get("name")) {
                    uri = uri.replace(":"+urlName, encodeURIComponent(this.get("searchTerm")));
                }
                else {
                    uri = uri.replace(":"+urlName, encodeURIComponent(dep.get("value")));
                }
            }, this);
            if (this.get("n.param")) {
                uri = uri.replace(":"+this.get("n.param"), 0);
            }
            return this.restClient.url(uri);
        },
                
        /* fetch one more to see if there are any
         * @see EXPRESSIONPLOT-105
         * @see EXPRESSIONPLOT-185
         * UPDATE: fetch all of the results - if performance problems
         * occur, refine the list population with dynamic loading
         * on scrolling for example
         */
        getSuggestions: function() {
            this._getSuggestionsBus.push(this.prepareUri());
//            var promise = this.sync("read", this, {
//                url:    this.prepareUri()
//            });
//            if (this.runningGetSuggestionRequest) {
//                this.runningGetSuggestionRequest.abort();
//            }
//            this.trigger("fetch:suggestions:start");
//            // an originalRequest is the one containing XHR object properties
//            this.runningGetSuggestionRequest = promise.originalRequest;
//            var model = this;
//            return promise.then(function(suggestions) {
//                if (! suggestions.responseIsError) {
//                    model.set("suggestions", model.prepareSuggestions(suggestions));
//                    // trigger additional event to change:suggestions as
//                    // they may not have changed at all
//                    model.trigger("fetch:suggestions:success", model);
//                    // pass prepared array of items
//                    return model.get("suggestions");
//                }
//                else {
//                    model.trigger("fetch:suggestions:fail", model);
//                }
//            }, function() {
//                // if readyState != 4 then request could have been aborted
//                promise.originalRequest.readyState === 4 && model.trigger("fetch:suggestions:fail");
//            });
        },
        /**
         * If a suggestion is plain string it transforms it into an object.
         * Each item gets its array index added.
         * View needs original index to properly call selectItem() if 
         * suggestion list is narrowed down due to filtering of values.
         * @param {Array} suggestions
         * @returns {Array}
         */
        prepareSuggestions: function(suggestions) {
            return _.map(suggestions, function(item, i) {
                switch (this.get("response.type")) {
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
         
//        toJSON: function(parentJSON, mode, attributes) {
//            var json;
//            if (mode === "url") {
//                json = {
//                    v:   this.get("value"),
//                    r:   this.get("readable")
//                };
//                if (this.get("selfDependent")) json.s = this.get("searchTerm");
//            }
//            else {
//                json = this.get("value");
//            }
//            if (parentJSON && this.isActive()) {
//                if (_.isArray(parentJSON)) parentJSON.push(json);
//                else parentJSON[this.get("name")] = json;
//            }
//            return json;
//        },
        _toJSONMapper: function(mode, attributes, isActive) {
            var isSimple = ! attributes || (attributes && attributes.length === 1),
                json;
            if (! isActive) return "__inactive__";
            if (isSimple) {
                if (mode === "url") {
                    json = {
                        v:   this.get("value"),
                        r:   this.get("readable")
                    };
                    if (this.get("selfDependent")) json.s = this.get("searchTerm");
                }
                else {
                    json = this.get("value");
                }
            }
            return json;
        },
        toJSON: function(mode, attributes) {
            return this.isActive()
                    .take(1)
                    .map(this, "_toJSONMapper", mode, attributes);
        },
        fromJSON:   function(json, attributes) {
            if (! json || _.isEmpty(json)) return;
            var isSimple = ! attributes || (attributes && attributes.length === 1);
            if (isSimple) {
                // this would start unnecessary request during page load, defer it
//                this.get("selfDependent") && json.s && this.set("searchTerm", json.s);
                json.r && this.set("readable", json.r);
                // change:value event will be emitted
                json.v && this.set("value", json.v);
                // I need a separate event that always fires unlike change:value;
                // this event is caught by the router if the json is provided by the URL
                json.v && this.trigger("value:from:json", this, json.v);
            }
            else {
                _.each(attributes, function(attr) {
                    this.set(attr, json[attr]);
                }, this);
            }
        },
                
        reset:  function() {
            this.unset("value");
            this.unset("readable");
            this.unset("suggestions");
            if (this.get("selfDependent")) this.unset("searchTerm");
        },
                
        destroy:    function() {
            this.stopListening();// required to avoid orphaned self-dependent-listeners
            ParameterModel.prototype.destroy.call(this);
        }
    });
    
    return ComboboxParameterModel;
});