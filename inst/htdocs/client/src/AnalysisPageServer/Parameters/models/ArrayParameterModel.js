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
        for (var i = 0; i < this.get("start"); i++) {
            this.addChild();
        }
    },
    addChild() {
        if (! this.isMax()) {
            var offsetModel = this.collection.getLastDescendantOf(this);
            // if there is no children the Array acts as an offset
            offsetModel = offsetModel || this;
            var at = this.collection.indexOf(offsetModel)+1;
            var child = this.collection.add(_.clone(this.get("prototype")), {
                // children are added just after their parent
                at,
                parent: this
            });
            this.children.add(child);
            return child;
        }
    },
    destroyLastChild() {
        if (! this.isMin()) {
            var last = this.children.pop();
            last.destroy();
        }
    },
    isStart() {
        return this.children.size() <= this.get("start");
    },
    isMin() {
        return this.children.size() <= this.get("min");
    },
    isMax() {
        return this.children.size() >= this.get("max");
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
                finalJson.push(childJson);
            }
            return finalJson;
        }, [], this);
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
        if (! _.isArray(json)) return;

        // extract meaningful items
        var meaningfulItems = _.reduce(json, (memo, itemJson) => {
            if (itemJson !== "" && ! _.isEmpty(itemJson)) {
                memo.push(itemJson);
            }
            return memo;
        }, []);

        var toRemove = this.children.size() - _.size(meaningfulItems);
        if (toRemove > 0) {
            for (var i = 0; i < toRemove; i++) {
                this.destroyLastChild();
            }
        }

        var child;
        _.each(meaningfulItems, (childJson, i) => {
            child = this.children.at(i);
            child || (child = this.addChild());
            child.fromJSON(childJson, attributes, opts);
        });
    }
});
