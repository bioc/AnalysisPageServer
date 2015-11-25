/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./fetch/ParametersFetchController", "./show/ArrayShowController",
    "./show/ParametersShowController", 
    "./Summary/show/SummaryShowController",
    "./SetValueController", 
    "./DisplayCallbackController",
    "./GetClosestController", "./GetDependentController",
    "./ShowIfController", "./ShowIfAdvancedController",
    "./ConditionalPersistent/ConditionalPersistentController",
    "./Persistent/PersistentController",
    "./Select/select-app", 
    "./Combobox/combobox-app"], 
function(Marionette, app, ParametersFetchController, ArrayShowController,
ParametersShowController, SummaryShowController, SetValueController, 
DisplayCallbackController, GetClosestController, GetDependentController,
ShowIfController, ShowIfAdvancedController,
ConditionalPersistentController, PersistentController) {
    var module = app.module("AnalysisPageServer.Parameters");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.fetchC = new ParametersFetchController();
        this.arrayC = new ArrayShowController();
        this.showC = new ParametersShowController();
        this.summaryC = new SummaryShowController();
    });
    module.on("stop", function() {
        this.fetchC.destroy();
        this.arrayC.destroy();
        this.showC.destroy();
        this.summaryC.destroy();
    });
    module.on("start", function() {
        module.setValueC = new SetValueController();
        module.displayCallbackC = new DisplayCallbackController();
        module.getClosestC = new GetClosestController();
        module.getDependentC = new GetDependentController();
        module.showIfC = new ShowIfController();
        module.showIfAdvancedC = new ShowIfAdvancedController();
        module.conditionalPersistentC = new ConditionalPersistentController();
        module.persistentC = new PersistentController();
    });
    module.on("stop", function() {
        module.setValueC.destroy();
        module.displayCallbackC.destroy();
        module.getClosestC.destroy();
        module.getDependentC.destroy();
        module.showIfC.destroy();
        module.showIfAdvancedC.destroy();
        module.conditionalPersistentC.destroy();
        module.persistentC.destroy();
    });
    return module;
});