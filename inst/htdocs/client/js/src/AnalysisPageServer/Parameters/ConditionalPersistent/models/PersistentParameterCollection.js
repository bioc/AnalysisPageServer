/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "config", "backbone.localstorage"], function(Backbone, config) {
    return Backbone.Collection.extend({
        localStorage: new Backbone.LocalStorage(config["parameter.collection.localStorage"])
    });
});