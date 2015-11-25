/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "./ParameterModel", "./ParameterChildrenCollection"], 
function(Bacon, ParameterModel, ChildrenCollection) {
    return ParameterModel.extend({
        initialize: function() {
            ParameterModel.prototype.initialize.apply(this, arguments);
            this.children = new ChildrenCollection();
        },
        initializeChildren: function() {
            for (var i = 0; i < this.get("start"); i++) {
                this.addChild();
            }
            // @see EXPRESSIONPLOT-472
            this._childrenInitialized = true;
            if (this._jsonToParse) {
                this.fromJSON(this._jsonToParse);
                delete this._jsonToParse;
            }
        },
        addChild:   function() {
            if (! this.isMax()) {
                var offsetModel = this.collection.getLastDescendantOf(this);
                // if there is no children the Array acts as an offset
                offsetModel = offsetModel || this;
                var at = this.collection.indexOf(offsetModel)+1;
                var child = this.collection.add(_.clone(this.get("prototype")), {
                    // children are added just after their parent
                    at:     at,
                    parent: this
                });
                this.children.add(child);
                return child;
            }
        },
        destroyLastChild:    function() {
            if (! this.isMin()) {
                var last = this.children.pop();
                last.destroy();
            }
        },
        isStart: function() {
            return this.children.size() <= this.get("start");
        },
        isMin:  function() {
            return this.children.size() <= this.get("min");
        },
        isMax:  function() {
            return this.children.size() >= this.get("max");
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
                    finalJson.push(childJson);
                }
                return finalJson;
            }, [], this);
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
        fromJSON:   function(json, attributes, opts) {
            if (! _.isArray(json)) return;
            // @see EXPRESSIONPLOT-472
            if (! this._childrenInitialized) {
                this._jsonToParse = json;
                return;
            }
            // extract meaningful items
            var meaningfulItems = _.reduce(json, function(memo, itemJson) {
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
            _.each(meaningfulItems, function(childJson, i) {
                child = this.children.at(i);
                child || (child = this.addChild());
                child.fromJSON(childJson, attributes, opts);
            }, this);
        }
    });
});