/**
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 * Defines a FLAT collection of all Parameters belonging to specific Page.
 * Parameters can be items of Array Parameters or Compound Parameters and therefore
 * form nested structures.
 * Each Parameter has "children" and "parent" properties to easily move
 * between them.
 * NEW: The Collection is sorted so that each root parameter is in a place
 * specified by the server "params" response. Additionally if a parameter is complex
 * then its children are placed after it and before any other non-descendant element.
 */
import _ from "underscore";
import Backbone from "backbone";
import Bacon from "bacon";
import config from "config";
import app from "app";
import ParameterModel from "./ParameterModel";
import createComboboxParameterModel from "../Combobox/models/createComboboxParameterModel";
import ArrayParameterModel from "./ArrayParameterModel";
import CompoundParameterModel from "./CompoundParameterModel";
import createSelectParameterModel from "../Select/models/createSelectParameterModel";
import FileParameterModel from "./FileParameterModel";

const LOG = config["log.debug.messages"];

export default Backbone.Collection.extend({

    url: config["parameter.collection.url"],

    initialize(models, opts) {
        this.pageModel = opts.pageModel;
        this.on({
            "add":      this.onAdd,
            "remove":   this.onRemove
        });
        this.addES = Bacon.fromEvent(this, "add");
        this.modelsParsed = Bacon.fromEvent(this, "sync").map(true)
                .toProperty(false);
        this.storageRead = Bacon.fromEvent(this, "read-collection-storage").map(true)
                .toProperty(false);

        Bacon.combineTemplate({
            addedModel: this.addES,
            modelsParsed: this.modelsParsed,
            storageRead: this.storageRead
        })
        .takeUntil(
            // remember that "destroy" event is also dispatched on the collection
            // if a child model is destroyed (think array's children)
            // that's why we need to specifically listen to "destroy" of collection
            // itself
            this.getDestroyES()
                .filter(arg => ! (arg instanceof Backbone.Model))
        )
        .onValue(t => {
            LOG && console.log("ParameterCollection Reactive Property", t);
            // is called on every change in one of template properties;
            // modelsParsed changes once to true when "sync" event is emitted
            // after server response has been parsed and set on collection;
            // storageRead is set to true when localStorage has been read
            // and values applied to parameters;
            // addedModel changes whenever "add" event is emitted by collection;
            // this ensures dynamically added parameters in "array" are covered
            if (t.modelsParsed) {
                if (! t.storageRead) {
                    // when collection is created children of all initial parameters
                    // have to be set up BEFORE collection localStorage is read
                    this.invoke("initializeChildren");
                }
                else {
                    // at this point values have been taken from server response and later
                    // adjusted by localStorage read for whole collection
                    this.initializeParameters();
                }
            }
        });
    },
    initializeParameters() {
        let uninitializedChildren = this.filter(parameter => !parameter.areChildrenInitialized());
        LOG && console.log("initializeParameters initializeChildren", _.pluck(_.pluck(uninitializedChildren, "attributes"), "label"));
        _.invoke(uninitializedChildren, "initializeChildren");
        let uninitialized = this.filter(parameter => !parameter.isInitialized());
        LOG && console.log("initializeParameters uninitialized", _.pluck(_.pluck(uninitialized, "attributes"), "label"));
        _.each(uninitialized, parameter =>
            app.channel.request("parameters:listen-to-set-value", parameter));
        // at this point all parameters in collection are aware of "set:value" event -
        // every change in value triggered later will notify
        // other interested parameters
        _.each(uninitialized, parameter =>
            app.channel.request("parameters:conditional-persistent:initialize", parameter));
        // at this point values are up-to-date - if applicable they are taken
        // from localStorage for persistent parameters;
        // persistent parameter values can overwrite previous values and turn
        // collection into a dirty state where parameters dependent on persistent ones
        // have to adjust values
        _.each(uninitialized, parameter => {
            app.channel.request("parameters:display.callback:run", parameter);
            app.channel.request("parameters:show.if:run", parameter);
        });
        _.invoke(uninitialized, "isInitialized", true);
        // console.log("parameters isInitialized flag", this.pluck("name"), this.pluck("_isInitialized"));
    },
    /**
     *
     * @param {Object} attrs
     * @param {Object} options
     * @returns ParameterModel
     */
    model(attrs, options) {
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
    sync(method, coll, options) {
        options.page = options.page || this.pageModel.get("name");
        return Backbone.Collection.prototype.sync.call(this, method, coll, options);
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
    fromJSON(paramJson, attributes) {
        _.map(this.getRoots(), (root) => {// fromJSON on top-level params
            return root.fromJSON(paramJson[root.get("name")], attributes, {});
        });
    },
    getRoots() {
        return this.filter(model => {// acquire top-level parameters
            return !model.parent;
        });
    },
    getCommonParents(model1, model2) {
        return _.intersection(model1.getParents(), model2.getParents());
    },
    getLastDescendantOf(model) {
        var last = null, next = null, index = this.indexOf(model);
        if (index < 0) return null;
        next = this.at(++index);
        while (next && _.indexOf(next.getParents(), model) > -1) {
            last = next;
            next = this.at(++index);
        }
        return last;
    },
    getAdvanced() {
        return this.where({advanced: 1});
    },
    hasAdvanced() {
        return _.size(this.getAdvanced()) > 0;
    },
    _reduceBooleanValues(booleanArray) {
        return this.reduce((memo, parameter, i) => {
            booleanArray[i] && memo.push(parameter);
            return memo;
        }, []);
    },
    getActive() {
        return Bacon.combineAsArray(
                this.map(parameter => {
                    return parameter.isActive();
                })
                )
                .map(this, "_reduceBooleanValues");
    },
    getReady() {
        return Bacon.combineAsArray(
                this.map(parameter => {
                    return parameter.isReady();
                })
                )
                .map(this, "_reduceBooleanValues");
    },
    getUnready() {
        var coll = this;
        return this.getReady()
                .map(
                    readyParameters => coll.filter(
                        param => readyParameters.indexOf(param) === -1
                    )
                );
    },
    /**
     * Triggered when a model is added to this collection
     * @param {type} model
     * @returns {undefined}
     */
    onAdd(parameter) {
        this.listenTo(parameter, "value:from:json", this.onModelValueFromJson);
    },

    onRemove(parameter) {
        this.stopListening(parameter);
    },

    onModelValueFromJson(parameter, value) {
        this.trigger("parameter:value:from:json", parameter, value);
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
    },
    getFiles() {
        return this.where({type: "file"});
    }
});
