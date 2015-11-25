/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./show/ComboboxShowController", "./SuggestionsCallbackController"], 
function(Marionette, app, ShowController, SuggestionsCallbackController) {
    var module = app.module("AnalysisPageServer.Parameters.Combobox");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new ShowController();
        module.suggestionsCallbackC = new SuggestionsCallbackController();
    });
    return module;
});