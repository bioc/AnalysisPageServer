/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
// import app from "app";
import HeaderShowController from "./show/HeaderShowController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.headerShowC = new HeaderShowController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.headerShowC.destroy();
    }
};

// app.on("before:start", () => {
//     module.headerShowC = new HeaderShowController({
//     });
// });
// app.on("destroy", () => {
//     module.headerShowC.destroy();
// });

export default module;
