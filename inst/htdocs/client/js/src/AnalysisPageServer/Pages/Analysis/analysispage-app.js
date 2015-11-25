/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/AnalysisPageShowRouter"], 
function(Marionette, app, ShowRouter) {
    var module = app.module("AnalysisPageServer.Pages.Analysis");
    module.on("start", function() {
        this.showRouter = new ShowRouter();
    });
    return module;
});