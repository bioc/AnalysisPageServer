/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./show/HeaderShowController"], 
function(Marionette, app, HeaderShowController) {
    var module = app.module("Common.App.Header");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.headerShowC = new HeaderShowController({
        });
    });
    return module;
});