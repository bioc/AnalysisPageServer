/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Bacon from "bacon";
import app from "app";

export default Backbone.Model.extend({
    parent:     null,
    children:   null,
    initialize(attrs, opts) {
        this.parent = opts.parent;
        app.channel.request("parameters:show.if:initialize", this);
        app.channel.request("parameters:display.callback:initialize", this);
        app.channel.request("parameters:show.if.advanced:initialize", this);
        this.initializeParentIsActiveProperty();
        this.initializeIsActiveProperty();
        this.initializeHasValueProperty();
        // this.listenTo(this.collection, "add", this.onCollectionAdd);
        // this.waitWithMajorInitialization();
    },
    initializeHasValueProperty() {
        this.hasValueProperty = Bacon.fromEvent(this, "change:value",
            model => model.hasValue()
        ).toProperty(this.hasValue());

        this.hasValueProperty
                .takeUntil(this.getDestroyES())
                .onValue(function() {});
    },
    _reduceBooleanFactors(booleanArray) {
        return _.reduce(booleanArray, (memo, factor) => memo && factor, true);
    },
    initializeIsActiveProperty() {
        this.isActiveProperty = Bacon.combineAsArray(
                this.parentIsActiveProperty,
                this.advancedProperty,
                this.showIfProperty,
                this.displayCallbackProperty
                )
                .map(this, "_reduceBooleanFactors");
        // register fake listener - this a requirement for streams/properties
        // to get updated
        this.isActiveProperty
                .takeUntil(this.getDestroyES())
                .onValue(function() {});
    },
    initializeParentIsActiveProperty() {
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
    // waitWithMajorInitialization() {
    //     // reactive property
    //     this.isInitialized =
    //     // Three important events mark point in time when parameter can proceed
    //     // with initialization:
    //     // 1. when a collection has been initialized from localStorage
    //     // 2. when collection finished parsing server response
    //     // 3. when actual parameter model has been added to the collection
    //     Bacon.combineWith(
    //         (locallyRead, modelsParsed, isAdded) =>
    //             locallyRead && modelsParsed && !!isAdded,
    //         this.collection.locallyReadProp,
    //         this.collection.modelsParsed,
    //         Bacon.fromEvent(this, "collection:add")
    //     );
    //
    //     this.isInitialized
    //             .filter(_.isEqual, true)
    //             .takeUntil(this.getDestroyES())
    //             .take(1)
    //             .onValue(this, "_timeShiftedInitialize");
    // },

    // _timeShiftedInitialize() {
    //     // read persistent value (if applicable)
    //     // only after json of the whole collection has been read
    //     app.channel.request("parameters:conditional-persistent:initialize", this);
    //     app.channel.request("parameters:display.callback:run", this);
    //     app.channel.request("parameters:show.if:run", this);
    //     app.channel.request("parameters:listen-to-set-value", this);
    //     // this.initializeChildren && this.initializeChildren();
    //     // this.trigger("initialize:fully");
    // },

    isFlagSet(flag, set) {
        if (typeof set !== "undefined") {
            this.set(flag, set);
        }
        else {
            return this.get(flag);
        }
    },

    initializeChildren() {
        // a no-op for majority of subtypes
        this.areChildrenInitialized(true);
    },
    areChildrenInitialized(set) {
        return this.isFlagSet("_childrenInitialized", set);
    },
    isInitialized(set) {
        return this.isFlagSet("_isInitialized", set);
    },

    /**
     * Allow only for READ operations
     * POSTing doesn't make sense as server doesn't handle this type
     * of communication
     * @param {type} method
     * @returns {@exp;Backbone@pro;sync@call;apply}
     */
    sync(method) {
        if (method === "read") return Backbone.sync.apply(Backbone, arguments);
    },
    hasValue() {
        return this.has("value") && this.getValue() !== "";
    },
    setValue(value, opts) {
        opts = opts || {};
        this.set("value", value, opts);
        // sometimes a value may not be different than previous one
        // so fire additional event
        this.trigger("set:value", this, value, opts);
    },
    unsetValue(opts) {
        opts = opts || {};
        this.unset("value", opts);
        this.trigger("set:value", this, void 0, _.extend({unset: true}, opts));
    },
    getValue() {
        return this.get("value");
    },
    reset() {
        this.unsetValue();
    },
    isComplex() {
        return false;
    },
    anyParentIsAdvanced() {
        return _.some(this.getParents(), parent => parent.get("advanced"));
    },
    /**
     * Return value changed in August, 2014
     * Previously returned a boolean value
     * @returns {Bacon.Property}
     */
    isActive() {
        return this.isActiveProperty;
    },

    _isReadyMap(obj) {
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
    isReady() {
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
    getParents() {
        var parent = this.parent, parents = [];
        while (parent) {
            parents.push(parent);
            parent = parent.parent;
        }
        return parents;
    },

    _toJSONMapper(mode, attributes, isActive) {
        var isSimple = ! attributes || (attributes && attributes.length === 1),
            json;
        if (! isActive) return void 0;
        if (isSimple) {
            return this.getValue();
        }
        else {
            json = {};
            _.each(attributes, attr => {
                json[attr] = this.get(attr);
            });
        }
        return json;
    },
    /**
     *
     * @param {type} mode
     * @param {type} attributes
     * @returns {Bacon.Property}
     */
    conditionalToJSON(mode, attributes) {
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
    fromJSON(json, attributes, opts) {
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
            _.each(attributes, attr => {
                this.set(attr, json[attr]);
            });
        }
    },
    /**
     * Returns <b>ALL</b> dependecies a parameter can have merged in one array
     * @returns {Array}
     */
    getDependenciesNames() {
        var deps = this.getPersistentDependenciesNames();
        deps = deps.concat(this.getDisplayCallbackDependenciesNames());
        this.getShowIfDependencyName() && deps.push(this.getShowIfDependencyName());
        return _.uniq(deps);
    },
    getDependencies() {
        if (this._dependenciesCache) {
            return this._dependenciesCache;
        }
        var depNames = this.getDependenciesNames();
        this._dependenciesCache = _.map(depNames, depName => {
            return app.channel.request("parameters:get-closest", this, {name: depName});
        });
        return this._dependenciesCache;
    },
    getPersistentDependenciesNames() {
        var deps = _.clone(this.get("persistent_dependencies")) || [];
        return _.isArray(deps) ? deps : [deps];
    },
    getPersistentDependencies() {
        if (this._persistentDependenciesCache) {
            return this._persistentDependenciesCache;
        }
        var depNames = this.getPersistentDependenciesNames();
        this._persistentDependenciesCache = _.map(depNames, depName => {
            return app.channel.request("parameters:get-closest", this, {name: depName});
        });
        return this._persistentDependenciesCache;
    },
    getDisplayCallbackDependenciesNames() {
        var dc = _.clone(this.get("display.callback"));
        return dc && dc.dependent ? _.values(dc.dependent) : [];
    },
    getDisplayCallbackDependencies() {
        if (this._displayCallbackDependenciesCache) {
            return this._displayCallbackDependenciesCache;
        }
        var depNames = this.getDisplayCallbackDependenciesNames();
        this._displayCallbackDependenciesCache = _.map(depNames, depName => {
            return app.channel.request("parameters:get-closest", this, {name: depName});
        });
        return this._displayCallbackDependenciesCache;
    },
    getShowIfDependencyName() {
        var si = _.clone(this.get("show.if"));
        return si && si.name ? si.name : null;
    },
    getShowIfDependency() {
        if (this._showIfDependencyCache) {
            return this._showIfDependencyCache;
        }
        var depName = this.getShowIfDependencyName();
        this._showIfDependencyCache = app.channel.request("parameters:get-closest", this, {name: depName});
        return this._showIfDependencyCache;
    }
    // onCollectionAdd(model) {
    //     // check if just added model is "this", meaning we can initialize children
    //     // collection items are added gradually to maintain order
    //     if (this === model) this.trigger("collection:add", this);
    // }
});
