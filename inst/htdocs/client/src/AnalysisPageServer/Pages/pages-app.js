/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import PagesFetchController from "./fetch/PagesFetchController";
import AnalysisFetchController from "./fetch/AnalysisFetchController";
import primarypageApp from "./Primary/primarypage-app";
import analysispageApp from "./Analysis/analysispage-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        primarypageApp.start();
        analysispageApp.start();
        module.fetchC = new PagesFetchController();
        module.fetchAnalysisC = new AnalysisFetchController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        primarypageApp.stop();
        analysispageApp.stop();
        module.fetchC.destroy();
        module.fetchAnalysisC.destroy();
    }
};

// app.on("before:start", () => {
//     module.fetchC = new PagesFetchController();
//     module.fetchAnalysisC = new AnalysisFetchController();
// });
// app.on("destroy", () => {
//     module.fetchC.destroy();
//     module.fetchAnalysisC.destroy();
// });

export default module;
