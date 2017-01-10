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
import _ from "underscore";
import Backbone from "backbone";
import Bacon from "bacon";
import config from "config";

export default Backbone.Collection.extend({

    initialize(models, opts) {

    },

    /**
     * @param {Object} models
     * @param {Object} options
     * @returns {Array}
     */
    parse(models, options) {
        // The server responds with a hash of parameters
        // and Backbone expects an array so I make it here.
        return _.values(models);
    },
    _toJSONMapper(jsonArray) {
        return _.reduce(this.getRoots(), (finalJson, parameter, i) => {
            if (jsonArray[i] !== void 0) {
                finalJson[parameter.get("name")] = jsonArray[i];
            }
            return finalJson;
        }, {});
    },
    conditionalToJSON(mode, attributes) {
        return Bacon.combineAsArray(
                _.map(this.getRoots(), root => {// getJSON on top-level params and put them into fresh {}
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
    fromJSON(paramJson, attributes) {
        _.map(this.getRoots(), root => {// fromJSON on top-level params
            return root.fromJSON(paramJson[root.get("name")], attributes);
        });
    },
    getFirstUnready() {
        // collection is sorted and contains all of form parameters
        return this.find(model => !model.isReady());
    },
    getAdvanced() {
        return this.where({advanced: 1});
    },
    hasAdvanced() {
        return _.size(this.getAdvanced()) > 0;
    },
    _getActiveMapper(activeArray) {
        return this.reduce((memo, parameter, i) => {
            activeArray[i] && memo.push(parameter);
            return memo;
        }, []);
    },
    getActive() {
        return Bacon.combineAsArray(
                    this.map(parameter => parameter.isActive().take(1))
                )
                .map(this, "_getActiveMapper");
    },

    _isReadyMapper(isReadyArray) {
        return _.reduce(isReadyArray, (memo, isReady) => memo && isReady, true);
    },
    /**
     * Tests if the collection is ready to be sent for analysis
     * @returns {Bacon.Property}
     */
    isReady() {
        return Bacon.combineAsArray(this.map(parameter => parameter.isReady()))
            .map(this, "_isReadyMapper");
    },

    getPersistent() {
        return this.filter(parameter => parameter.get("persistent"));
    }
});
