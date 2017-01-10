/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import ShowRouter from "./show/AnalysisPageShowRouter";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.showRouter = new ShowRouter();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        this.showRouter.destroy();
    }
};
// app.on("before:start", () => {
//     module.showRouter = new ShowRouter();
// });
// app.on("destroy", () => {
//     module.showRouter.destroy();
// });
export default module;
