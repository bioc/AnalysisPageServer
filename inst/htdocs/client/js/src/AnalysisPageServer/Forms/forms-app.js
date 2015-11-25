/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./show/FormsShowController"], 
function(Marionette, app, FormsShowController) {
    var module = app.module("AnalysisPageServer.Forms");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new FormsShowController({
            
        });
    });
    return module;
});