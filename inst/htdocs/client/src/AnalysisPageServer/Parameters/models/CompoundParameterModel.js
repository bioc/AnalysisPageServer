/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Bacon from "bacon";
import ParameterModel from "./ParameterModel";
import ChildrenCollection from "./ParameterChildrenCollection";

export default ParameterModel.extend({
    initialize() {
        ParameterModel.prototype.initialize.apply(this, arguments);
        this.children = new ChildrenCollection();
    },
    initializeChildren() {
        //console.log("initializeChildren", this.get("label"));
        if (this.areChildrenInitialized()) return;
        this.areChildrenInitialized(true);
        _.each(this.get("children"), childAttrs => this.addChild(childAttrs));
    },
    addChild(attrs) {
        var offsetModel = this.collection.getLastDescendantOf(this);
        // if there is no children the Compound acts as an offset
        offsetModel = offsetModel || this;
        var at = this.collection.indexOf(offsetModel)+1;
        var child = this.collection.add(attrs, {
            at:     at,
            parent: this
        });
        this.children.add(child);
    },
    destroy() {
        var child;
        while (child = this.children.pop()) {
            child.destroy();
        }
        this.children.reset();
        ParameterModel.prototype.destroy.call(this);
    },
    isComplex() {
        return true;
    },
    _toJSONMapper(childJsonArray) {
        return _.reduce(childJsonArray, (finalJson, childJson, i) => {
            var child = this.children.at(i);
            if (child && childJson !== void 0) {
                finalJson[child.get("name")] = childJson;
            }
            return finalJson;
        }, {}, this);
    },
    conditionalToJSON(mode, attributes) {
        return Bacon.combineAsArray(
            this.children.map(child => {
                // each toJSON call may use "display.callback" property
                // and in result wait for server response
                return child.conditionalToJSON(mode, attributes);
            })
        ).map(this, "_toJSONMapper");
    },
    fromJSON(json, attributes, opts) {
        if (json && ! _.isEmpty(json)) {
            this.children.each(child => {
                child.fromJSON(json[child.get("name")], attributes, opts);
            });
        }
    }
});
