/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./fetch/PagesFetchController", "./fetch/AnalysisFetchController",
    "./Primary/primarypage-app", "./Analysis/analysispage-app"], 
function(Marionette, app, PagesFetchController, AnalysisFetchController) {
    var module = app.module("AnalysisPageServer.Pages");
    var globalChannel = Backbone.Wreqr.radio.channel("global");
    
    globalChannel.reqres.setHandler("pages:collection", function() {
        return this.pages;
    }, module);
    
    globalChannel.commands.setHandler("pages:collection:set", function(coll) {
        this.pages = coll;
    }, module);
    
    module.on("start", function() {
        this.fetchC = new PagesFetchController({
            pages: this.pages
        });
        this.fetchAnalysisC = new AnalysisFetchController();
    });
    return module;
});