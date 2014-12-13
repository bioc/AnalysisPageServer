/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon"], function(Backbone, Bacon) {
    var Parameter = Backbone.Model.extend({
        parent:     null,
        children:   null,
        initialize: function(attrs, opts) {
            this.parent = opts.parent;
            this.initializeAdvancedProperty();
            this.initializeShowIfProperty();
            this.initializeDisplayCallbackProperty();
            this.initializeParentIsActiveProperty();
            this.initializeIsActiveProperty();
            this.listenTo(this.collection, "add", this.onCollectionAdd);
            this.listenTo(this.collection.appModel, "change:mode", this.onAppModelChangeMode);
            this.waitWithMajorInitialization();
        },
        initializeAdvancedProperty: function() {
            this._advancedBus = new Bacon.Bus();
            this.advancedProperty = this._advancedBus
                    .takeUntil(this.getDestroyES())
                    .toProperty(this.isShownIfAdvanced());
        },
        _lookupShowIfDependentModels: function() {
            var si = this.get("show.if");
            if (si) {
                this._showIfControllingModel = this.getClosestWithName(si.name);
                this.listenTo(this._showIfControllingModel, "change:value", this.onControllingModelChangeValue);
                // seed the property
                this._showIfBus.push(this.isShownIf());
            }
            else {
                this._showIfBus.push(true);
            }
        },
        initializeShowIfProperty: function() {
            this._showIfBus = new Bacon.Bus();
            this.showIfProperty = this._showIfBus
                    .takeUntil(this.getDestroyES())
                    .toProperty();
        },
        _lookupDisplayCallbackDependentModels: function() {
            var dc = this.get("display.callback");
            if (dc) {
                this._displayCallbackDependentModels = [];
                _.each(dc.dependent, function(paramName) {
                    var paramModel = this.getClosestWithName(paramName);
                    this._displayCallbackDependentModels.push(paramModel);
                    this.listenTo(paramModel, "change:value", this.onDisplayCallbackDependentChange);
                }, this);
                // seed the property
                this._displayCallbackBus.push(this._buildDisplayCallbackUrl());
            }
        },
        _buildDisplayCallbackUrl: function() {
            var dc = this.get("display.callback");
            var uri = dc.uri;
            return _.reduce(this._displayCallbackDependentModels, function(builtUrl, depModel) {
                return builtUrl.replace(
                            ":"+dc.dependent[depModel.get("name")], 
                            encodeURIComponent(depModel.get("value"))
                                    );
            }, uri, this);
        },
        onDisplayCallbackDependentChange: function() {
            this._displayCallbackBus.push(this._buildDisplayCallbackUrl());
        },
        
        initializeDisplayCallbackProperty: function() {
            var dc = this.get("display.callback");
            if (dc && dc.dependent && dc.uri) {
                this._displayCallbackBus = new Bacon.Bus();
                this.displayCallbackProperty = 
                    this._displayCallbackBus
                        .takeUntil(this.getDestroyES())
                        .slidingWindow(2, 1)
                        .filter(this, "_filterDisplayCallbackUrl")
//                .log("_displayCallbackBus after", this.get("label"), this.collection.pageModel.get("name"), (new Date).toString())
                        .debounce(dc.delay || 0)
                        .flatMapLatest(this, "_mapDisplayCallbackUrlToRequest")
                        .toProperty();
            }
            else {
                this.displayCallbackProperty = Bacon.constant(true);
            }
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
//                    .log("isActiveProperty", this.get("label"), this.collection.pageModel.get("name"))
                    .map(this, "_reduceBooleanFactors");
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
            this._lookupShowIfDependentModels();
            this._lookupDisplayCallbackDependentModels();
            this.initializeChildren && this.initializeChildren();
        },
        
        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        _filterDisplayCallbackUrl: function(tuple) {
            // if there is no previous url then pass this through
            if (_.size(tuple) === 1) return true;
            // otherwise ony pass url that is different than prev
            return tuple[0] !== tuple[1];
        },
        _mapDisplayCallbackUrlToRequest: function(tuple) {
            return Bacon.fromPromise(Backbone.ajax({
                url: tuple[1] || tuple[0],
                dataType: "json"
            }), true);
        },
        /**
         * Allow only for READ operations
         * POSTing doesn't make sense as server doesn't handle this type
         * of communication
         * @param {type} method
         * @returns {@exp;Backbone@pro;sync@call;apply}
         */
        sync:           function(method) {
            if (method === "read") return Backbone.sync.apply(Backbone, arguments);
        },
        hasValue:       function() {
            return this.has("value") && this.get("value") !== "";
        },
        isComplex:      function() {
            return false;
        },
        /**
         * @returns {Boolean}
         */
        isShownIfAdvanced: function() {
            return this.get("advanced") ? this.collection.appModel.isModeAdvanced() : true;
        },
        anyParentIsAdvanced: function() {
            return _.some(this.getParents(), function(parent) {
                return parent.get("advanced");
            });
        },
        isShownIf:  function() {
            var si = this.get("show.if");
            if (! si) return true;            
            return si.values == this._showIfControllingModel.get("value");
        },
        getClosestWithName: function(name) {
            var coll = this.collection;
            var parametersWithName = coll.where({name: name});
            if (_.size(parametersWithName) === 1) return _.first(parametersWithName);
            var index = coll.indexOf(this);
            // get max number of common parents in the collection
            var maxCommonParents = _.max(_.map(parametersWithName, function(parameter) {
                return _.size(coll.getCommonParents(this, parameter));
            }, this));
            var withMaxCommonParents = _.filter(parametersWithName, function(parameter) {
                return _.size(coll.getCommonParents(this, parameter)) === maxCommonParents;
            }, this);
//            console.log("getClosestWithName", parametersWithName, maxCommonParents, withMaxCommonParents);
            // now when parameters with provided name and highest number of common
            // parents are elected, sort by index
            // in ascending order
            return _.first(_.sortBy(withMaxCommonParents, function(parameter) {
                return Math.abs(index - coll.indexOf(parameter));
            }, this));
        },
        
        /**
         * Return value changed in August, 2014
         * Previously returned a boolean value
         * @returns {Bacon.Property}
         */
        isActive:   function() {
            return this.isActiveProperty;
        },

        _isReadyMap: function(isActive) {
            if (isActive) {
                if (! this.get("required") || this.isComplex()) {
                    return true;
                }
                else {
                    return this.hasValue();
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
            return this.isActive()
                    .take(1)
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
        
        areDependenciesMet: function() {
            // currently only comboboxes have dependencies but this may change
            // in the future
            return true;
        },
        
        /**
         * 
         * @param {Object} parentJSON
         * @param {String} mode Whether the JSON is generated for form submission
         * or permalink.
         * @param {Array} attributes
         * @returns {Object}
         */
//        toJSON:     function(parentJSON, mode, attributes) {
//            var isSimple = ! attributes || (attributes && attributes.length === 1),
//                parameter = this, json;
//        
//            if (isSimple) {
//                if (mode === "url") {
//                    json = this.get("value");
//                }
//                else {
//                    json = this.get("value");
//                }
//            }
//            else {
//                json = {};
//                _.each(attributes, function(attr) {
//                    json[attr] = parameter.get(attr);
//                });
//            }
//    
//            if (parentJSON && this.isActive()) {
//                if (_.isArray(parentJSON)) parentJSON.push(json);
//                else parentJSON[this.get("name")] = json;
//            }
//            
//            return json;
//        },
        _toJSONMapper: function(mode, attributes, isActive) {
            var isSimple = ! attributes || (attributes && attributes.length === 1),
                json;
            if (! isActive) return "__inactive__";
            if (isSimple) {
                return this.get("value");
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
        toJSON: function(mode, attributes) {
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
        fromJSON:   function(json, attributes) {
            if (json === void 0) return;
            var isSimple = ! attributes || (attributes && attributes.length === 1);
            if (isSimple) {
                this.set("value", json);
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
                
        onControllingModelChangeValue:  function() {
            this._showIfBus.push(this.isShownIf());
        },

        onCollectionAdd:    function(model) {
            // check if just added model is "this", meaning we can initialize children
            // collection items are added gradually to maintain order
            if (this === model) this.trigger("collection:add", this);
        },
//        onAppModelChangeMode:   function(model, mode) {
//            this.trigger("active", this.isActive());
//        },
        onAppModelChangeMode:   function(model, mode) {
            this._advancedBus.push(this.isShownIfAdvanced());
        },
        onBeforeDisplayCallback: function() {
            this._triggerDisplayCallbackIfNeeded();
        }
    });
    
    return Parameter;
});