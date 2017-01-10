/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import formsApp from "./Forms/forms-app";
import pagesApp from "./Pages/pages-app";
import parametersApp from "./Parameters/parameters-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        formsApp.start();
        pagesApp.start();
        parametersApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        formsApp.stop();
        pagesApp.stop();
        parametersApp.stop();
    }
};

export default module;
