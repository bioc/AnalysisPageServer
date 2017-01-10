/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import AnalysisFetchController from "./fetch/AnalysisFetchController";
import PagesFetchController from "./fetch/PagesFetchController";
import datasetsApp from "./Datasets/datasets-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        datasetsApp.start();
        module.fetchAnalysisC = new AnalysisFetchController();
        module.pagesFetchC = new PagesFetchController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        datasetsApp.stop();
        module.fetchAnalysisC.destroy();
        module.pagesFetchC.destroy();
    }
};


export default module;
