/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon"], 
function(Backbone, Bacon) {
    var Parameter = Backbone.Model.extend({
        parent:     null,
        children:   null,
        initialize: function(attrs, opts) {
            this.parent = opts.parent;
            this.getCommands().execute("parameters:show.if:initialize", this);
            this.getCommands().execute("parameters:display.callback:initialize", this);
            this.getCommands().execute("parameters:persistent:initialize", this);
            this.getCommands().execute("parameters:conditional-persistent:initialize", this);
            this.getCommands().execute("parameters:show.if.advanced:initialize", this);
            this.initializeParentIsActiveProperty();
            this.initializeIsActiveProperty();
            this.initializeHasValueProperty();
            this.listenTo(this.collection, "add", this.onCollectionAdd);
//            this.listenTo(this.collection.appModel, "change:mode", this.onAppModelChangeMode);
            this.waitWithMajorInitialization();
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        initializeHasValueProperty: function() {
            this.hasValueProperty = Bacon.fromEvent(this, "change:value", function(model) {
                return model.hasValue();
            }).toProperty(this.hasValue());
            
            this.hasValueProperty
                    .takeUntil(this.getDestroyES())
                    .onValue(function() {});
        },
        _reduceBooleanFactors: function(booleanArray) {
            return _.reduce(booleanArray, function(memo, factor) {
                return memo && factor;
            }, true);
        },
        initializeIsActiveProperty: function() {
            this.isActiveProperty = Bacon.combineAsArray(
                    this.parentIsActiveProperty,
                    this.advancedProperty,
                    this.showIfProperty,
                    this.displayCallbackProperty
                    )
                    .map(this, "_reduceBooleanFactors")
            // register fake listener - this a requirement for streams/properties
            // to get updated
            this.isActiveProperty
                    .takeUntil(this.getDestroyES())
                    .onValue(function() {});
        },
        initializeParentIsActiveProperty: function() {
            // parameter has to be notified of the immediate parent activity changes;
            // changes of other ancestors are propagated one level at time,
            // there is no need to listen to changes of all parents
            if (this.parent) {
                this.parentIsActiveProperty = this.parent.isActive();
            }
            else {
                this.parentIsActiveProperty = Bacon.constant(true);
            }
            
        },
        waitWithMajorInitialization: function() {
            // reactive property
            this.isInitialized = 
            // Two important events mark point in time when parameter can proceed
            // with initialization:
            // 1. when collection finished parsing server response
            // 2. when actual parameter model has been added to the collection
            Bacon.combineAsArray(
                    this.collection.modelsParsed.filter(_.isEqual, true),
                    this.asEventStream("collection:add")
            )
            .map(true)
            .startWith(false);
            this.isInitialized
                    .filter(_.isEqual, true)
                    .takeUntil(this.getDestroyES())
                    .take(1)
                    .onValue(this, "_timeShiftedInitialize");
        },
        
        _timeShiftedInitialize: function() {
            this.getCommands().execute("parameters:display.callback:run", this);
            this.getCommands().execute("parameters:show.if:run", this);
            this.getCommands().execute("parameters:listen-to-set-value", this);
            this.initializeChildren && this.initializeChildren();
            this.trigger("initialize:fully");
        },
        
        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        /**
         * Allow only for READ operations
         * POSTing doesn't make sense as server doesn't handle this type
         * of communication
         * @param {type} method
         * @returns {@exp;Backbone@pro;sync@call;apply}
         */
        sync: function(method) {
            if (method === "read") return Backbone.sync.apply(Backbone, arguments);
        },
        hasValue: function() {
            return this.has("value") && this.getValue() !== "";
        },
        setValue: function(value, opts) {
            opts = opts || {};
            this.set("value", value, opts);
            // sometimes a value may not be different than previous one
            // so fire additional event
            this.trigger("set:value", this, value, opts);
        },
        unsetValue: function(opts) {
            opts = opts || {};
            this.unset("value", opts);
            this.trigger("set:value", this, void 0, _.extend({unset: true}, opts));
        },
        getValue: function() {
            return this.get("value");
        },
        reset: function() {
            this.unsetValue();
        },
        isComplex: function() {
            return false;
        },
        anyParentIsAdvanced: function() {
            return _.some(this.getParents(), function(parent) {
                return parent.get("advanced");
            });
        },
        /**
         * Return value changed in August, 2014
         * Previously returned a boolean value
         * @returns {Bacon.Property}
         */
        isActive: function() {
            return this.isActiveProperty;
        },

        _isReadyMap: function(obj) {
            if (obj.isActive) {
                if (! this.get("required") || this.isComplex()) {
                    return true;
                }
                else {
                    return obj.hasValue;
                }
            }
            else {
                return true;
            }
        },
        /**
         * 
         * @returns {Bacon.Property}
         */
        isReady: function() {
            return Bacon.combineTemplate({
                isActive: this.isActive(),
                hasValue: this.hasValueProperty
            })
            .map(this, "_isReadyMap");
        },
        /**
         * Returns all parents of this model, from direct to grand-
         * @returns {Array}
         */
        getParents: function() {
            var parent = this.parent, parents = [];
            while (parent) {
                parents.push(parent);
                parent = parent.parent;
            }
            return parents;
        },

        _toJSONMapper: function(mode, attributes, isActive) {
            var isSimple = ! attributes || (attributes && attributes.length === 1),
                json;
            if (! isActive) return "__inactive__";
            if (isSimple) {
                return this.getValue();
            }
            else {
                json = {};
                _.each(attributes, function(attr) {
                    json[attr] = this.get(attr);
                }, this);
            }
            return json;
        },
        /**
         * 
         * @param {type} mode
         * @param {type} attributes
         * @returns {Bacon.Property}
         */
        conditionalToJSON: function(mode, attributes) {
            return this.isActive()
                    .take(1)
                    .map(this, "_toJSONMapper", mode, attributes);
        },
        /**
         * Read JSON value attached to this parameter. The object comes from
         * URL.
         * @param {Object} json
         * @param {Array} attributes
         * @returns {undefined}
         */
        fromJSON: function(json, attributes, opts) {
            if (json === void 0) return;
            var isSimple = ! attributes || (attributes && attributes.length === 1);
            if (isSimple) {
                this.setValue(json, opts);
//                this.set("value", json);
                // I need a separate event that always fires unlike change:value;
                // this event is caught by the router if the json is provided by the URL
                this.trigger("value:from:json", this, json);
            }
            else {
                _.each(attributes, function(attr) {
                    this.set(attr, json[attr]);
                }, this);
            }
        },
        /**
         * Returns <b>ALL</b> dependecies a parameter can have merged in one array
         * @returns {Array}
         */    
        getDependenciesNames: function() {
            var deps = this.getPersistentDependenciesNames();
            deps = deps.concat(this.getDisplayCallbackDependenciesNames());
            this.getShowIfDependencyName() && deps.push(this.getShowIfDependencyName());
            return _.uniq(deps);
        },
        getDependencies: function() {
            if (this._dependenciesCache) {
                return this._dependenciesCache;
            }
            var depNames = this.getDependenciesNames();
            this._dependenciesCache = _.map(depNames, function(depName) {
                return this.getReqRes().request("parameters:get-closest", this, {name: depName});
            }, this);
            return this._dependenciesCache;
        },
        getPersistentDependenciesNames: function() {
            var deps = _.clone(this.get("persistent_dependencies")) || [];
            return _.isArray(deps) ? deps : [deps];
        },
        getPersistentDependencies: function() {
            if (this._persistentDependenciesCache) {
                return this._persistentDependenciesCache;
            }
            var depNames = this.getPersistentDependenciesNames();
            this._persistentDependenciesCache = _.map(depNames, function(depName) {
                return this.getReqRes().request("parameters:get-closest", this, {name: depName});
            }, this);
            return this._persistentDependenciesCache;
        },
        getDisplayCallbackDependenciesNames: function() {
            var dc = _.clone(this.get("display.callback"));
            return dc && dc.dependent ? _.values(dc.dependent) : [];
        },
        getDisplayCallbackDependencies: function() {
            if (this._displayCallbackDependenciesCache) {
                return this._displayCallbackDependenciesCache;
            }
            var depNames = this.getDisplayCallbackDependenciesNames();
            this._displayCallbackDependenciesCache = _.map(depNames, function(depName) {
                return this.getReqRes().request("parameters:get-closest", this, {name: depName});
            }, this);
            return this._displayCallbackDependenciesCache;
        },
        getShowIfDependencyName: function() {
            var si = _.clone(this.get("show.if"));
            return si && si.name ? si.name : null;
        },
        getShowIfDependency: function() {
            if (this._showIfDependencyCache) {
                return this._showIfDependencyCache;
            }
            var depName = this.getShowIfDependencyName();
            this._showIfDependencyCache = this.getReqRes().request("parameters:get-closest", this, {name: depName});
            return this._showIfDependencyCache;
        },
        onCollectionAdd:    function(model) {
            // check if just added model is "this", meaning we can initialize children
            // collection items are added gradually to maintain order
            if (this === model) this.trigger("collection:add", this);
        }
    });
    
    return Parameter;
});