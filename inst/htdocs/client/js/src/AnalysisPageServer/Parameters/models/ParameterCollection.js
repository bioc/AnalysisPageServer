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
define(["backbone", "bacon", "config", "./ParameterModel", 
    "../Combobox/models/createComboboxParameterModel",
    "./ArrayParameterModel",
    "./CompoundParameterModel",
    "../Select/models/createSelectParameterModel", "./FileParameterModel",
    "backbone.eventstreams"], 
    function(Backbone, Bacon, config, ParameterModel, 
    createComboboxParameterModel, ArrayParameterModel,
    CompoundParameterModel, createSelectParameterModel, FileParameterModel) {
    
    var ParameterCollection = Backbone.Collection.extend({
        url:    config["parameter.collection.url"],
        
        initialize: function(models, opts) {
            this.pageModel = opts.pageModel;
            this.on({
                "add":      this.onAdd,
                "remove":   this.onRemove
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
                case "file":
                    return new FileParameterModel(attrs, options);
                case "combobox":
                    return createComboboxParameterModel(attrs, options);
                case "select":
                    return createSelectParameterModel(attrs, options);
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
        conditionalToJSON: function(mode, attributes) {
            return Bacon.combineAsArray(
                    _.map(this.getRoots(), function(root) {// getJSON on top-level params and put them into fresh {}
                        return root.conditionalToJSON(mode, attributes);
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
                return root.fromJSON(paramJson[root.get("name")], attributes, {});
            });
        },
        getRoots:   function() {
            return this.filter(function(model) {// acquire top-level parameters
                return !model.parent;
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
        getAdvanced: function() {
            return this.where({advanced: 1});
        },
        hasAdvanced: function() {
            return _.size(this.getAdvanced()) > 0;
        },
        _reduceBooleanValues: function(booleanArray) {
            return this.reduce(function(memo, parameter, i) {
                booleanArray[i] && memo.push(parameter);
                return memo;
            }, []);
        },
        getActive: function() {
            return Bacon.combineAsArray(
                    this.map(function(parameter) {
                        return parameter.isActive();
                    })
                    )
                    .map(this, "_reduceBooleanValues");
        },
        getReady: function() {
            return Bacon.combineAsArray(
                    this.map(function(parameter) {
                        return parameter.isReady();
                    })
                    )
                    .map(this, "_reduceBooleanValues");
        },
        getUnready: function() {
            var coll = this;
            return this.getReady()
                    .map(function(readyParameters) {
                        return coll.filter(function(param) {
                            return readyParameters.indexOf(param) === -1;
                        });
                    });
        },
        /**
         * Triggered when a model is added to this collection
         * @param {type} model
         * @returns {undefined}
         */
        onAdd: function(parameter) {
            this.listenTo(parameter, "value:from:json", this.onModelValueFromJson);
        },
                
        onRemove: function(parameter) {
            this.stopListening(parameter);
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
        },
                
        getPersistent: function() {
            return this.filter(function(parameter) {
                return parameter.get("persistent");
            });
        },
        getFiles: function() {
            return this.where({type: "file"});
        }
    });
    
    return ParameterCollection;
});