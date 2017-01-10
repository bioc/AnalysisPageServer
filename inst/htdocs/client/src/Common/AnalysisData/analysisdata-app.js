/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "./styles/main.less!";
import htmlApp from "./Html/html-app";
import arraysApp from "./Arrays/arrays-app";
import tablesApp from "./Tables/tables-app";
import plotsApp from "./Plots/plots-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        htmlApp.start();
        arraysApp.start();
        tablesApp.start();
        plotsApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        htmlApp.stop();
        arraysApp.stop();
        tablesApp.stop();
        plotsApp.stop();
    }
};

export default module;
