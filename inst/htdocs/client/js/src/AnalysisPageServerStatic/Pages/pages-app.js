/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./fetch/AnalysisFetchController",
    "./fetch/PagesFetchController",
    "./Datasets/datasets-app"], 
function(Marionette, app, AnalysisFetchController, PagesFetchController) {
    var module = app.module("AnalysisPageServerStatic.Pages");
    var globalChannel = Backbone.Wreqr.radio.channel("global");
    
    globalChannel.reqres.setHandler("pages:collection", function() {
        return this.pages;
    }, module);
    
    globalChannel.commands.setHandler("pages:collection:set", function(coll) {
        this.pages = coll;
    }, module);
    
    module.on("start", function() {
        this.fetchAnalysisC = new AnalysisFetchController();
        this.pagesFetchC = new PagesFetchController({
            pages: this.pages
        });
    });
    return module;
});