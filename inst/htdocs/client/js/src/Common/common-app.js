/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./App/app-app", "./AnalysisData/analysisdata-app"], 
function(Marionette, app) {
    var module = app.module("Common");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        
    });
    return module;
});