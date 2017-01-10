/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import FormsShowController from "./show/FormsShowController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.showC = new FormsShowController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        this.showC.destroy();
    }
};

// app.on("before:start", () => {
//     module.showC = new FormsShowController({
//
//     });
// });
// app.on("destroy", () => {
//     module.showC.destroy();
// });

export default module;
