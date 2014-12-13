/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "config", "backbone.localstorage"], function(Backbone, config) {
    
    var PageLocalModel = Backbone.Model.extend({
        localStorage:   new Backbone.LocalStorage(config["page.model.localStorage"]),
        defaults:   {
            analysisMeanLoadTime: 3000
        },
        initialize: function() {
            this.fetch();
        },
        setAnalysisMeanLoadTime:    function(newTime) {
            var k = "analysisMeanLoadTime";
            this.set(k, parseInt((parseInt(this.get(k)) + newTime)/2)); 
        }
    });
    
    return PageLocalModel;
});