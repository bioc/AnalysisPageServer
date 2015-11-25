/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/DatasetsShowRouter"],
function(Marionette, app, ShowRouter) {
    var module = app.module("AnalysisPageServerStatic.Pages.Datasets");
    var globalChannel = Backbone.Wreqr.radio.channel("global");

    module.on("before:start", function() {
        this.showRouter = new ShowRouter();
    });
    return module;
});
