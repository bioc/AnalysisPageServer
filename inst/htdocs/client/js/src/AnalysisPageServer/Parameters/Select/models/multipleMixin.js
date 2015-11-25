/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone"], function(Backbone) {
    
    return function(ParentModel) {
        return [{
                defaults: function() {
                    return {
                        value: []
                    };
                },
                selectAll: function(opts) {
                    this.setValue(_.map(this.get("choices"), function(text, id) {
                        return id;
                    }), opts);
                },
                deselectAll: function() {
                    this.setValue([]);
                },
                reset:  function() {
                    this.setValue([]);
                }
        }, {}];
    };
    
});