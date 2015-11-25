/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./Html/html-app", "./Arrays/arrays-app", 
    "./Tables/tables-app", "./Plots/plots-app"], 
function(Marionette, app) {
    var module = app.module("Common.AnalysisData");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        
    });
    return module;
});