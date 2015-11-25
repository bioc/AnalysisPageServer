/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/PlotsShowController", 
    "./SettingsModelController",
    "./SideMenu/menu-app", "./Svg/svg-app", "./Sidebar/sidebar-app"], 
    function(Marionette, app, ShowController, SettingsController) {
    var module = app.module("Common.AnalysisData.Plots");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new ShowController();
        this.settingsC = new SettingsController();
    });
    return module;
});