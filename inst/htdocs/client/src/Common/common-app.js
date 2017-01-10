/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
// import app from "app";
import "./styles/common.less!";
import appApp from "./App/app-app";
import analysisdataApp from "./AnalysisData/analysisdata-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        appApp.start();
        analysisdataApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        appApp.stop();
        analysisdataApp.stop();
    }
};

export default module;
