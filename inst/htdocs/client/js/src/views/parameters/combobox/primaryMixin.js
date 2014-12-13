/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * This is NOT a Backbone View. The module returns an array with prototype and 
 * static properties, just like Backbone.View.extend() method accepts.
 * You should use ComboboxParameterViewFactory to create Combobox Views.
 */
define([], function() {
    return function(ParentView) {
        return [{
        getType:    function() {
            return ParentView.TYPE_PRIMARY;
        },
        getTemplateOptions: function() {
            return _.extend(ParentView.prototype.getTemplateOptions.call(this), {
                primary:    true,
                descSize:   this.getDescSize()
            });
        }
    }];
    }
});