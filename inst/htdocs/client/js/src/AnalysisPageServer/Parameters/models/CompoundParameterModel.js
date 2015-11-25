/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "./ParameterModel", "./ParameterChildrenCollection"], 
function(Bacon, ParameterModel, ChildrenCollection) {
    var CompoundParameterModel = ParameterModel.extend({
        initialize: function() {
            ParameterModel.prototype.initialize.apply(this, arguments);
            this.children = new ChildrenCollection();
        },
        initializeChildren: function() {
            _.each(this.get("children"), function(childAttrs) {
                this.addChild(childAttrs);
            }, this);
            // @see EXPRESSIONPLOT-472
            this._childrenInitialized = true;
            if (this._jsonToParse) {
                this.fromJSON(this._jsonToParse);
                delete this._jsonToParse;
            }
        },
        addChild:   function(attrs) {
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
        destroy: function() {
            var child;
            while (child = this.children.pop()) {
                child.destroy();
            }
            this.children.reset();
            ParameterModel.prototype.destroy.call(this);
        },
        isComplex:      function() {
            return true;
        },
        _toJSONMapper: function(childJsonArray) {
            return _.reduce(childJsonArray, function(finalJson, childJson, i) {
                var child = this.children.at(i);
                if (child && childJson !== "__inactive__") {
                    finalJson[child.get("name")] = childJson;
                }
                return finalJson;
            }, {}, this);
        },
        conditionalToJSON: function(mode, attributes) {
            return Bacon.combineAsArray(
                this.children.map(function(child) {
                    // each toJSON call may use "display.callback" property
                    // and in result wait for server response
                    return child.conditionalToJSON(mode, attributes);
                })
            ).map(this, "_toJSONMapper");
        },
//        toJSON: function(parentJSON, mode, attributes) {
//            var json = {};
//            _.map(this.children, function(child) {
//                return child.toJSON(json, mode, attributes);
//            });
//            if (parentJSON && this.isActive()) {
//                if (_.isArray(parentJSON)) parentJSON.push(json);
//                else parentJSON[this.get("name")] = json;
//            }
//            return json;
//        },
        fromJSON:   function(json, attributes, opts) {
            if (json && ! _.isEmpty(json)) {
                // @see EXPRESSIONPLOT-472
                if (! this._childrenInitialized) {
                    this._jsonToParse = json;
                }
                else {
                    this.children.each(function(child) {
                        child.fromJSON(json[child.get("name")], attributes, opts);
                    });
                }
            }
        }
    });
    return CompoundParameterModel;
});