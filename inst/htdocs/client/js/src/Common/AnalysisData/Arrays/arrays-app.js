/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/ArraysShowController", 
    "./show/TabsShowController", "./show/ListShowController"], 
function(Marionette, app, ShowController, TabsShowController, ListShowController) {
    var module = app.module("Common.AnalysisData.Arrays");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new ShowController();
        this.tabsShowC = new TabsShowController();
        this.listShowC = new ListShowController();
    });
    return module;
});