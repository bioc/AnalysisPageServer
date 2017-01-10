/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import ShowController from "./show/ArraysShowController";
import TabsShowController from "./show/TabsShowController";
import ListShowController from "./show/ListShowController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.showC = new ShowController();
        module.tabsShowC = new TabsShowController();
        module.listShowC = new ListShowController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.showC.destroy();
        module.tabsShowC.destroy();
        module.listShowC.destroy();
    }
};

// app.on("before:start", () => {
//     module.showC = new ShowController();
//     module.tabsShowC = new TabsShowController();
//     module.listShowC = new ListShowController();
// });
// app.on("destroy", () => {
//     module.showC.destroy();
//     module.tabsShowC.destroy();
//     module.listShowC.destroy();
// });

export default module;
