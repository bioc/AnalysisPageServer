/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import AppShowController from "./show/AppShowController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.appShowC = new AppShowController({
            appView: null
        });
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.appShowC.destroy();
    }
};

// app.on("before:start", () => {
//     module.appShowC = new AppShowController({
//         appView: null
//     });
// });
// app.on("destroy", () => {
//     module.appShowC.destroy();
// });

export default module;
