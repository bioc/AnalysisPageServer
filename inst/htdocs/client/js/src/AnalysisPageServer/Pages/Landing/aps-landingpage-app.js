/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/LandingPageShowRouter", 
    "./show/APSLandingPageShowController",
    "./ToolOverview/tooloverview-app"], 
    function(Marionette, app, LandingPageShowRouter, ShowController) {
    var module = app.module("AnalysisPageServer.Pages.Landing");
    module.on("start", function() {
        this.showRouter = new LandingPageShowRouter({
            controller: new ShowController()
        });
    });
    return module;
});