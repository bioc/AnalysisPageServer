/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "models/parameters/ParameterModel"], function(Backbone, ParentModel) {
    var Parameter = ParentModel.extend({
        selectAll: function(opts) {
            this.set("value", _.map(this.get("choices"), function(text, id) {
                return id;
            }), opts);
        },
        deselectAll: function() {
            this.unset("value");
        }
    });
    
    return Parameter;
});