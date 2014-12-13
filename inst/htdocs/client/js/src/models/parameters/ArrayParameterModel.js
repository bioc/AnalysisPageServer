/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "models/parameters/ParameterModel"], function(Bacon, ParameterModel) {
    var ArrayParameterModel = ParameterModel.extend({
        initialize: function() {
            ParameterModel.prototype.initialize.apply(this, arguments);
            this.children = [];
        },
        initializeChildren: function() {
            for (var i = 0; i < this.get("start"); i++) {
                this.addChild();
            }
        },
        addChild:   function() {
            if (! this.isMax()) {
                var offsetModel = this.collection.getLastDescendantOf(this);
                // if there is no children the Array acts as an offset
                offsetModel = offsetModel || this;
                var at = this.collection.indexOf(offsetModel)+1;
                this.collection.add(_.clone(this.get("prototype")), {
                    // children are added just after their parent
                    at:     at,
                    parent: this
                });
                var child = this.collection.at(at);
                this.children.push(child);
                this.trigger("add:child", child);
                return child;
            }
        },
        destroyLastChild:    function() {
            if (! this.isMin()) {
                var last = this.children.pop();
                this.trigger("destroy:child", last);
                last.destroy();
            }
        },
        isStart: function() {
            return this.children.length <= this.get("start");
        },
        isMin:  function() {
            return this.children.length <= this.get("min");
        },
        isMax:  function() {
            return this.children.length >= this.get("max");
        },
        destroy: function() {
            var child = null;
            while (child = this.children.pop()) {
                child.destroy();
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
                    finalJson.push(childJson);
                }
                return finalJson;
            }, [], this);
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
//            var json = [];
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
            if (! _.isArray(json)) return;
            // extract meaningful items
            var meaningfulItems = _.reduce(json, function(memo, itemJson) {
                if (itemJson !== "" && ! _.isEmpty(itemJson)) {
                    memo.push(itemJson);
                }
                return memo;
            }, []);
            
            var toRemove = _.size(this.children) - _.size(meaningfulItems);
            if (toRemove > 0) {
                for (var i = 0; i < toRemove; i++) {
                    this.destroyLastChild();
                }
            }

            var child;
            _.each(meaningfulItems, function(childJson, i) {
                child = this.children[i];
                child || (child = this.addChild());
                child.fromJSON(childJson, attributes);
            }, this);
        }
    });
    return ArrayParameterModel;
});