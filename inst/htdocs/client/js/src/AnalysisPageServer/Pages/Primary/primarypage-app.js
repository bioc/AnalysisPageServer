/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/PrimaryPageShowRouter"], 
function(Marionette, app, PrimaryPageShowRouter) {
    var module = app.module("AnalysisPageServer.Pages.Primary");
    module.on("start", function() {
        this.showRouter = new PrimaryPageShowRouter();
    });
    return module;
});