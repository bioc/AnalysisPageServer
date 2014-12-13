/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone"], function(Backbone) {
    
    return function(ParentModel) {
        return [{
                hasValueInSuggestions:  function() {
                    return _.reduce(this.get("suggestions"), function(has, suggestion) {
                        return has || this.get("value") == suggestion.id
                    }, false, this);
                },
                updateFromView: function(props, opts) {
                    if (props.added) {
                        this.set("readable", props.added.text, opts);
                        this.set("value", props.added.id, opts);
                    }
                    else if (props.removed) {
                        props.removed.text === this.get("readable") && this.unset("readable", opts);
                        props.removed.id === this.get("value") && this.unset("value", opts);
                    }
                }
        }, {}];
    };
    
});