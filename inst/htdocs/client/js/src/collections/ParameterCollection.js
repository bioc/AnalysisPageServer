/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Defines a FLAT collection of all Parameters belonging to specific Page.
 * Parameters can be items of Array Parameters or Compound Parameters and therefore
 * form nested structures.
 * Each of Parameters has "children" and "parent" properties to easily move
 * between them.
 * NEW: The Collection is sorted so that each root parameter is in a place
 * specified by the server "params" response. Additionally if a parameter is complex 
 * then its children are placed after it and before any other non-descendant element.
 */
define(["backbone", "bacon", "config", "models/parameters/ParameterModel", 
    "models/parameters/combobox/createComboboxParameterModel",
    "models/parameters/ArrayParameterModel",
    "models/parameters/CompoundParameterModel",
    "models/parameters/SelectParameterModel"], 
    function(Backbone, Bacon, config, ParameterModel, createComboboxParameterModel, ArrayParameterModel,
    CompoundParameterModel, SelectParameterModel) {
    
    var ParameterCollection = Backbone.Collection.extend({
        url:    config["parameter.collection.url"],
        
        initialize: function(models, opts) {
            this.appModel = opts.appModel;
            this.pageModel = opts.pageModel;
            this.on({
                "add":      this.onAdd,
                "remove":   this.onRemove,
                "sync":     this.onSync
            });
            this.modelsParsed = this.asEventStream("sync").map(true)
                    .toProperty(false);
        },
        /**
         * 
         * @param {Object} attrs
         * @param {Object} options
         * @returns ParameterModel
         */
        model:  function(attrs, options) {
            switch (attrs.type) {
                case "compound":
                    return new CompoundParameterModel(attrs, options);
                case "array":
                    return new ArrayParameterModel(attrs, options);
                case "combobox":
                    return createComboboxParameterModel(attrs, options);
                case "select":
                    return new SelectParameterModel(attrs, options);
                default:
                    return new ParameterModel(attrs, options);
            }
        },
        sync:   function(method, coll, options) {
            options.page = options.page || this.pageModel.get("name");
            return Backbone.Collection.prototype.sync.call(this, method, coll, options);
        },
        /** 
         * @param {Object} models
         * @param {Object} options
         * @returns {Array}
         */
        parse:  function(models, options) {
            // The server responds with a hash of parameters
            // and Backbone expects an array so I make it here.
            return _.values(models);
        },
        _toJSONMapper: function(jsonArray) {
            return _.reduce(this.getRoots(), function(finalJson, parameter, i) {
                if (jsonArray[i] !== void 0 && jsonArray[i] !== "__inactive__") {
                    finalJson[parameter.get("name")] = jsonArray[i];
                }
                return finalJson;
            }, {});
        },
        toJSON: function(mode, attributes) {
            return Bacon.combineAsArray(
                    _.map(this.getRoots(), function(root) {// getJSON on top-level params and put them into fresh {}
                        return root.toJSON(mode, attributes);
                    })
                    )
                    .map(this, "_toJSONMapper")
        },
//        toJSON: function(mode, attributes) {
//            var json = {};
//            _.map(this.getRoots(), function(root) {// getJSON on top-level params and put them into fresh {}
//                return root.toJSON(json, mode, attributes);
//            });
//            return json;
//        },
        fromJSON:   function(paramJson, attributes) {
            _.map(this.getRoots(), function(root) {// fromJSON on top-level params
                return root.fromJSON(paramJson[root.get("name")], attributes);
            });
        },
        getRoots:   function(withName) {
            return this.filter(function(model) {// acquire top-level parameters
                return !model.parent && (withName ? model.get("name") === withName : true);
            });
        },
        getFirstUnready:    function() {
            // collection is sorted and contains all of form parameters
            return this.find(function(model) {
                return !model.isReady();
            });
        },
        getCommonParents:   function(model1, model2) {
            return _.intersection(model1.getParents(), model2.getParents());
        },
        getLastDescendantOf:    function(model) {
            var last = null, next = null, index = this.indexOf(model);
            if (index < 0) return null;
            next = this.at(++index);
            while (next && _.indexOf(next.getParents(), model) > -1) {
                last = next;
                next = this.at(++index);
            }
            return last;
        },
        getAdvanced:    function() {
            return this.where({advanced: 1});
        },
        hasAdvanced:    function() {
            return _.size(this.getAdvanced()) > 0;
        },
        _getActiveMapper: function(activeArray) {
            return this.reduce(function(memo, parameter, i) {
                activeArray[i] && memo.push(parameter);
                return memo;
            }, []);
        },
        getActive: function() {
            return Bacon.combineAsArray(
                    this.map(function(parameter) {
                        return parameter.isActive().take(1);
                    })
                    )
                    .map(this, "_getActiveMapper");
        },
        /**
         * Triggered when a model is added to this collection
         * @param {type} model
         * @returns {undefined}
         */
        onAdd:  function(parameter) {
            this.listenTo(parameter, "change:value", this.onModelChangeValue);
            this.listenTo(parameter, "value:from:json", this.onModelValueFromJson);
        },
                
        onRemove:   function(parameter) {
            this.stopListening(parameter);
            this.isReady()
                    .take(1)
                    .filter(_.isEqual, true)
                    .onValue(this, "trigger", "ready");
//            this.isReady() && this.trigger("ready");
        },
        
        onSync: function() {
//            this.modelsParsed = true;
//            this.trigger("after:parse:models");// needed for combobox parameters
            // to init their dependencies
        },
        
        onModelChangeValue: function(parameter, value) {
            this.trigger("parameter:change:value", parameter, value);
            this.isReady()
                    .take(1)
                    .filter(true)
                    .onValue(this, "trigger", "ready");
//            this.isReady() && this.trigger("ready");
        },
        onModelValueFromJson: function(parameter, value) {
            this.trigger("parameter:value:from:json", parameter, value);
        },
        _isReadyMapper: function(isReadyArray) {
            return _.reduce(isReadyArray, function(memo, isReady) {
                return memo && isReady;
            }, true);
        },
        /**
         * Tests if the collection is ready to be sent for analysis
         * @returns {Bacon.Property}
         */
        isReady:   function() {
            return Bacon.combineAsArray(this.map(function(parameter) {
                return parameter.isReady();
            }))
            .map(this, "_isReadyMapper");
//            return this.reduce(function(memo, parameter) {
//                return memo && parameter.isReady();
//            }, true);
        },
                
        getPersistent:  function() {
            return this.filter(function(parameter) {
                return parameter.get("persistent");
            });
        }
    });
    
    return ParameterCollection;
});