/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/LandingPageShowRouter", 
    "./show/EPLandingPageShowController",
    "./show/EPStudyFormShowController",
    "./ToolOverview/tooloverview-app"], 
    function(Marionette, app, LandingPageShowRouter, ShowController, EPStudyFormShowController) {
    var module = app.module("AnalysisPageServer.Pages.Landing");
    module.on("before:start", function() {
        this.showRouter = new LandingPageShowRouter({
            controller: new ShowController()
        });
        this.studyFormC = new EPStudyFormShowController();
    });
    return module;
});