/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "AnalysisPageServer/Parameters/models/ParameterModel"], 
    function(Backbone, Bacon, ParameterModel) {
    
    var ComboboxParameterModel = ParameterModel.extend({

        defaults: function() {
            return {
                value: null
            };
        },

        initialize:     function() {
//            this.restClient = createClient("REST");
//            this.initializeGetSuggestionsBus();
            ParameterModel.prototype.initialize.apply(this, arguments);
            this.getCommands().execute("parameters:combobox:suggestions:initialize", this);
            this.on({
                "change:suggestions": this.onChangeSuggestions,
                "fetch:suggestions:fail": this.onFetchSuggestionsFail
            });
        },
        _timeShiftedInitialize: function() {
            ParameterModel.prototype._timeShiftedInitialize.call(this);
        },

        /* fetch one more to see if there are any
         * @see EXPRESSIONPLOT-105
         * @see EXPRESSIONPLOT-185
         * UPDATE: fetch all of the results - if performance problems
         * occur, refine the list population with dynamic loading
         * on scrolling for example
         */
        getSuggestions: function() {
            this.getCommands().execute("parameters:combobox:suggestions:fetch", this);
        },
        
        _toJSONMapper: function(mode, attributes, isActive) {
            var isSimple = ! attributes || (attributes && attributes.length === 1),
                json;
            if (! isActive) return "__inactive__";
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
        conditionalToJSON: function(mode, attributes) {
            return this.isActive()
                    .take(1)
                    .map(this, "_toJSONMapper", mode, attributes);
        },
        fromJSON: function(json, attributes, opts) {
            if (! json || _.isEmpty(json)) return;
            var isSimple = ! attributes || (attributes && attributes.length === 1);
            if (isSimple) {
                // this would start unnecessary request during page load, defer it
//                this.get("selfDependent") && json.s && this.set("searchTerm", json.s);
                json.r && this.set("readable", json.r);
                // change:value event will be emitted
//                json.v && this.set("value", json.v);
                json.v && this.setValue(json.v, opts);
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
                
        reset: function() {
            this.unsetValue();
            this.unset("readable");
            this.unset("suggestions");
            if (this.get("selfDependent")) this.unset("searchTerm");
        },
                
        destroy: function() {
            this.stopListening();// required to avoid orphaned self-dependent-listeners
            ParameterModel.prototype.destroy.call(this);
        },
        
        getDependenciesNames: function() {
            var deps = ParameterModel.prototype.getDependenciesNames.call(this);
            deps = deps.concat(this.getComboboxDependenciesNames());
            return _.uniq(deps);
        },
        getComboboxDependenciesNames: function() {
            return _.values(this.get("dependent"));
        },
        getComboboxDependencies: function() {
            if (this._comboboxDependenciesCache) {
                return this._comboboxDependenciesCache;
            }
            var depNames = this.getComboboxDependenciesNames();
            this._comboboxDependenciesCache = _.map(depNames, function(depName) {
                return this.getReqRes().request("parameters:get-closest", this, {name: depName});
            }, this);
            return this._comboboxDependenciesCache;
        }
    });
    
    return ComboboxParameterModel;
});