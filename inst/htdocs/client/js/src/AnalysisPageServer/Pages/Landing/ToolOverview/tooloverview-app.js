/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/ToolOverviewShowController"], 
function(Marionette, app, ShowController) {
    var module = app.module("AnalysisPageServer.Pages.Landing.ToolOverview");
    module.on("start", function() {
        this.showC = new ShowController();
    });
    return module;
});