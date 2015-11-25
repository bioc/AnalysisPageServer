/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./show/SelectShowController"], 
function(Marionette, app, SelectShowController) {
    var module = app.module("AnalysisPageServer.Parameters.Select");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new SelectShowController();
    });
    return module;
});