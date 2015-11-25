/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone"], function(Backbone) {
    
    return function(ParentModel) {
        return [{
                defaults: function() {
                    return {
                        value: [],
                        readable: []
                    };
                },
                hasValueInSuggestions:  function() {
                    return _.reduce(this.get("suggestions"), function(has, suggestion) {
                        return has || _.indexOf(this.getValue(), suggestion.id) > -1
                    }, false, this);
                },
                updateFromView: function(props, opts) {
                    // first update readable attribute according to view's .val
                    var r, prevVPos, value;
                    // necessary to prevent situation when a string is compared to a number
                    value = _.map(this.getValue(), function(v) {
                        return v && v.toString();
                    });
                    r = _.map(props.val, function(v) {
                        prevVPos = _.indexOf(value, v && v.toString());
                        if (prevVPos === -1 && props.added) {// it's not found so probably new value
                            return props.added.text;
                        }
                        else {// found in previous values
                            return this.get("readable")[prevVPos];
                        }
                    }, this);
                    this.set("readable", r, opts);
                    this.setValue(props.val, opts);
                },
                selectAll: function(opts) {
                    this.set("readable", _.map(this.get("suggestions"), function(s) {
                        return s.long_name;
                    }), opts);
                    this.setValue(_.map(this.get("suggestions"), function(s) {
                        return s.id;
                    }), opts);
                },
                deselectAll: function() {
                    this.set("readable", []);
                    this.setValue([]);
                },
                reset:  function() {
                    this.setValue([]);
                    this.set("readable", []);
                    this.unset("suggestions");
                    if (this.get("selfDependent")) this.unset("searchTerm");
                }
        }, {}];
    };
    
});