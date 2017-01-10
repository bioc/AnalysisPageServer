/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
// import app from "app";
import ShowController from "./show/TheadShowController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.showC = new ShowController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.showC.destroy();
    }
};

// app.on("start", () => {
//     module.showC = new ShowController();
// });
// app.on("destroy", () => {
//     module.showC.destroy();
// });

export default module;
