/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/SidebarShowController"], 
    function(Marionette, app, ShowController) {
    var module = app.module("Common.AnalysisData.Plots.Sidebar");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new ShowController();
    });
    return module;
});