/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/TablesShowController", 
    "./download/TableDataDownloadController",
    "./Thead/thead-app", "./Tbody/tbody-app"], 
    function(Marionette, app, ShowController, DownloadController) {
    var module = app.module("Common.AnalysisData.Tables");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new ShowController();
        this.downloadC = new DownloadController();
    });
    return module;
});