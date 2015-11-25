/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./models/PersistentParameterCollection"], 
function(Marionette, PersistentParameterCollection) {
    return Marionette.Controller.extend({
        initialize: function() {
            // one unique collection across whole app, its parameters are
            // persistent through different pages
            this.collection = new PersistentParameterCollection();
            this.collection.fetch();
            this.getCommands().setHandler("parameters:conditional-persistent:initialize", this.initializeParameter, this);
            this.getCommands().setHandler("pages:parameters:conditional-persistent:update", this.update, this);
            this.getVent().on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
        },
        onDestroy: function() {
            this.collection.reset();
            this.getCommands().removeHandler("parameters:conditional-persistent:initialize");
            this.getCommands().removeHandler("pages:parameters:conditional-persistent:update");
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
        initializeParameter: function(parameter) {
            if (! this.canStoreConditionalValue(parameter)) return;
            var persistentParameter = this.getPersistentParameterFor(parameter);
            if (! persistentParameter) {
                // it wasn't yet encountered
                persistentParameter = this.collection.create({
                    id: parameter.get("persistent")
                });
            }
        },
        update: function(pageModel) {
            this.storeConditionalValues(pageModel);
            this.clearOldConditionalValues();
        },
        getPersistentParameterFor: function(parameter) {
            if (! this.canStoreConditionalValue(parameter)) return null;
            return this.collection.get(parameter.get("persistent"));
        },
        canStoreConditionalValue: function(parameter) {
            return parameter.get("persistent") && parameter.get("persistent_dependencies");
        },
        clearOldConditionalValues: function() {
            var valuesToStay;
            this.collection.each(function(persistentParameter) {
                valuesToStay = _.filter(persistentParameter.get("conditionalValues"), function(conditionalValue) {
                    return ! this._conditionalValueIsOld(conditionalValue);
                }, this);
                persistentParameter.set("conditionalValues", valuesToStay);
                persistentParameter.save();
            }, this);
        },
        _conditionalValueIsOld: function(conditionalValue) {
            // is older than a week
            return (new Date).getTime() - conditionalValue.lastUsed > 1000*60*60*24*7;
        },
        storeConditionalValues: function(pageModel) {
            pageModel.parameters.each(function(parameter) {
                this.storeConditionalValue(parameter);
            }, this);
        },
        storeConditionalValue: function(parameter) {
            var self = this;
            if (! this.canStoreConditionalValue(parameter)) return Promise.resolve();
            return parameter.conditionalToJSON("url")
                    .toPromise()
                    .then(function(value) {
                        self._insertOrUpdateConditionalValue(parameter, value);
                    });
        },
        _insertOrUpdateConditionalValue: function(parameter, value) {
            var localModel = this.getPersistentParameterFor(parameter);
            var dependentValues = this._getDependentValues(parameter);
            var found = this._findConditionalValueMatchingDependencies(parameter, function(valueEntry) {
                valueEntry.value = value;
                valueEntry.lastUsed = (new Date).getTime();
            });
            
            found || this._insertConditionalValue(localModel, dependentValues, value);
            localModel.save();
        },
        _insertConditionalValue: function(localModel, dependentValues, value) {
            var row = {
                dependent: dependentValues,
                value: value,
                lastUsed: (new Date).getTime()
            };
            var values = localModel.get("conditionalValues") || [];
            values.push(row);
            localModel.set("conditionalValues", values);
        },
        _findConditionalValueMatchingDependencies: function(parameter, callback) {
            var localModel = this.getPersistentParameterFor(parameter);
            var dependentValues = this._getDependentValues(parameter);
            return _.find(localModel.get("conditionalValues"), function(conditionalValue, i) {
                if (_.size(dependentValues) !== _.size(conditionalValue.dependent)) return false;
                var matchingDependencies = _.reduce(dependentValues, function(memo, depValue, depName) {
                    return memo && !!conditionalValue.dependent[depName]
                                && conditionalValue.dependent[depName] == depValue;
                        
                }, true);
                if (matchingDependencies) {
                    // update existing entry
                    callback && callback.call(this, localModel.get("conditionalValues")[i]);
                }
                else {
                    // keep searching
                }
                return matchingDependencies;
            }, this);
        },
        _getDependentValues: function(parameter) {
            var persDeps = parameter.getPersistentDependencies();
            return _.reduce(persDeps, function(memo, dep) {
                if (dep) {
                    memo[dep.get("persistent")] = dep.getValue();
                }
                return memo;
            }, {}, this);
        },
        anyDependencyHasOutdatedValue: function(parameter) {
            return _.some(parameter.getPersistentDependencies(), function(depParam) {
                return this.getReqRes().request("parameters:has-outdated-value", depParam);
            }, this);
        },
        onDependencyChangedValue: function(parameter, opts) {
            this.run(parameter, opts);
        },
        run: function(parameter, opts) {
            if (! this.canStoreConditionalValue(parameter)) return;
            if (this.anyDependencyHasOutdatedValue(parameter)) return;
            var valueEntry = this._findConditionalValueMatchingDependencies(parameter);
            if (valueEntry) {
                parameter.fromJSON(valueEntry.value, null, opts);
            }
            else {// trigger event so SetValueController can execute
                parameter.setValue(parameter.getValue());
            }
//            valueEntry && parameter.fromJSON(valueEntry.value, null, opts);
        }
    });
});