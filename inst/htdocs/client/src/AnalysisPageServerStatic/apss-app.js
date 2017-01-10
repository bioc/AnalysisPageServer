/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "./styles/main.less!";
import appApp from "./App/app-app";
import pagesApp from "./Pages/pages-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        appApp.start();
        pagesApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        appApp.stop();
        pagesApp.stop();
    }
};

export default module;
