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
define(["backbone", "bacon", "config",
    "backbone.eventstreams"], 
    function(Backbone, Bacon, config) {
    
    var ParameterCollection = Backbone.Collection.extend({
        
        initialize: function(models, opts) {

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
                return root.fromJSON(paramJson[root.get("name")], attributes, {globalSetValue: true});
            });
        },
        getFirstUnready:    function() {
            // collection is sorted and contains all of form parameters
            return this.find(function(model) {
                return !model.isReady();
            });
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