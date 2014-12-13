/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "config", "backbone.localstorage"], function(Backbone, config) {
    
    var TableDataLocalModel = Backbone.Model.extend({
        localStorage:   new Backbone.LocalStorage(config["tableData.model.localStorage"]),
        defaults:   {
            plotFetchMeanTime:  5000
        },
        initialize: function() {
            this.fetch();
        }
    });
    
    return TableDataLocalModel;
});