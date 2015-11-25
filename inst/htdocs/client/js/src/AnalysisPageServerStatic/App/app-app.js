/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/AppShowController"], 
function(Marionette, app, AppShowController) {
    var module = app.module("AnalysisPageServerStatic.App");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.appShowC = new AppShowController({
            appView: null
        });
    });
    return module;
});