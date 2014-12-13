/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "models/parameters/ParameterModel"], function(Bacon, ParameterModel) {
    var CompoundParameterModel = ParameterModel.extend({
        initialize: function() {
            ParameterModel.prototype.initialize.apply(this, arguments);
            this.children = [];
        },
        initializeChildren: function() {
            _.each(this.get("children"), function(childAttrs) {
                this.addChild(childAttrs);
            }, this);
        },
        addChild:   function(attrs) {
            var offsetModel = this.collection.getLastDescendantOf(this);
            // if there is no children the Compound acts as an offset
            offsetModel = offsetModel || this;
            var at = this.collection.indexOf(offsetModel)+1;
            this.collection.add(attrs, {
                at:     at,
                parent: this
            });
            var child = this.collection.at(at);
            this.children.push(child);
            this.trigger("add:child", child);
        },
        destroy: function() {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].destroy();
            }
            ParameterModel.prototype.destroy.call(this);
        },
        isComplex:      function() {
            return true;
        },
        _toJSONMapper: function(childJsonArray) {
            return _.reduce(childJsonArray, function(finalJson, childJson, i) {
                var child = this.children[i];
                if (child && childJson !== "__inactive__") {
                    finalJson[child.get("name")] = childJson;
                }
                return finalJson;
            }, {}, this);
        },
        toJSON: function(mode, attributes) {
            return Bacon.combineAsArray(
                _.map(this.children, function(child) {
                    // each toJSON call may use "display.callback" property
                    // and in result wait for server response
                    return child.toJSON(mode, attributes);
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
        fromJSON:   function(json, attributes) {
            json && ! _.isEmpty(json) && _.each(this.children, function(child) {
                child.fromJSON(json[child.get("name")], attributes);
            });
        }
    });
    return CompoundParameterModel;
});