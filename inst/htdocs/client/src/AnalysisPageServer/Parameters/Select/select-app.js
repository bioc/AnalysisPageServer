/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import SelectShowController from "./show/SelectShowController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.showC = new SelectShowController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.showC.destroy();
    }
};

// app.on("before:start", () => {
//     module.showC = new SelectShowController();
// });
// app.on("destroy", () => {
//     module.showC.destroy();
// });

export default module;
