/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone"], function(Backbone) {
    
    return function(ParentModel) {
        return [{
                hasValueInSuggestions:  function() {
                    return _.reduce(this.get("suggestions"), function(has, suggestion) {
                        return has || _.indexOf(this.get("value"), suggestion.id) > -1
                    }, false, this);
                },
                updateFromView: function(props, opts) {
                    // first update readable attribute according to view's .val
                    var r, prevVPos, value;
                    // necessary to prevent situation when a string is compared to a number
                    value = _.map(this.get("value"), function(v) {
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
                    this.set("value", props.val, opts);
                },
                selectAll: function(opts) {
                    this.set("readable", _.map(this.get("suggestions"), function(s) {
                        return s.long_name;
                    }), opts);
                    this.set("value", _.map(this.get("suggestions"), function(s) {
                        return s.id;
                    }), opts);
                },
                deselectAll: function() {
                    this.unset("readable");
                    this.unset("value");
                }
        }, {}];
    };
    
});