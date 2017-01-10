/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import ParametersFetchController from "./fetch/ParametersFetchController";
import ArrayShowController from "./show/ArrayShowController";
import ParametersShowController from "./show/ParametersShowController";
import SummaryShowController from "./Summary/show/SummaryShowController";
import SetValueController from "./SetValueController";
import DisplayCallbackController from "./DisplayCallbackController";
import GetClosestController from "./GetClosestController";
import GetDependentController from "./GetDependentController";
import ShowIfController from "./ShowIfController";
import ShowIfAdvancedController from "./ShowIfAdvancedController";
import ConditionalPersistentController from "./ConditionalPersistent/ConditionalPersistentController";
import selectApp from "./Select/select-app";
import comboboxApp from "./Combobox/combobox-app";

var module = {
    start() {
        if (module.isStarted) return;
        module.isStarted = true;
        module.fetchC = new ParametersFetchController();
        module.arrayC = new ArrayShowController();
        module.showC = new ParametersShowController();
        module.summaryC = new SummaryShowController();

        module.setValueC = new SetValueController();
        module.displayCallbackC = new DisplayCallbackController();
        module.getClosestC = new GetClosestController();
        module.getDependentC = new GetDependentController();
        module.showIfC = new ShowIfController();
        module.showIfAdvancedC = new ShowIfAdvancedController();
        module.conditionalPersistentC = new ConditionalPersistentController();

        selectApp.start();
        comboboxApp.start();
    },
    stop() {
        if (! module.isStarted) return;
        module.isStarted = false;
        module.fetchC.destroy();
        module.arrayC.destroy();
        module.showC.destroy();
        module.summaryC.destroy();

        module.setValueC.destroy();
        module.displayCallbackC.destroy();
        module.getClosestC.destroy();
        module.getDependentC.destroy();
        module.showIfC.destroy();
        module.showIfAdvancedC.destroy();
        module.conditionalPersistentC.destroy();

        selectApp.stop();
        comboboxApp.stop();
    }
};

// app.on("before:start", () => {
//     // module.fetchC = new ParametersFetchController();
//     // module.arrayC = new ArrayShowController();
//     // module.showC = new ParametersShowController();
//     // module.summaryC = new SummaryShowController();
//     module.start();
// });
// app.on("destroy", () => {
//     // module.fetchC.destroy();
//     // module.arrayC.destroy();
//     // module.showC.destroy();
//     // module.summaryC.destroy();
//     module.stop();
// });
// app.on("before:start", () => {
//     module.setValueC = new SetValueController();
//     module.displayCallbackC = new DisplayCallbackController();
//     module.getClosestC = new GetClosestController();
//     module.getDependentC = new GetDependentController();
//     module.showIfC = new ShowIfController();
//     module.showIfAdvancedC = new ShowIfAdvancedController();
//     module.conditionalPersistentC = new ConditionalPersistentController();
// });
// app.on("destroy", () => {
//     module.setValueC.destroy();
//     module.displayCallbackC.destroy();
//     module.getClosestC.destroy();
//     module.getDependentC.destroy();
//     module.showIfC.destroy();
//     module.showIfAdvancedC.destroy();
//     module.conditionalPersistentC.destroy();
// });
export default module;
