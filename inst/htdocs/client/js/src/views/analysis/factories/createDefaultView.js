/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone"], function(Backbone) {
    return function(definition, options) {
        var v = new Backbone.View();
        v.$el.html(definition.value);
        return v;
    }
});