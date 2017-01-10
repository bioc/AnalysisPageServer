/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import LandingPageShowRouter from "./show/LandingPageShowRouter";
import ShowController from "./show/APSLandingPageShowController";
import tooloverviewApp from "./ToolOverview/tooloverview-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        tooloverviewApp.start();
        module.showRouter = new LandingPageShowRouter({
            controller: new ShowController()
        });
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        tooloverviewApp.stop();
        module.showRouter.destroy();
    }
};
// app.on("before:start", () => {
//     module.showRouter = new LandingPageShowRouter({
//         controller: new ShowController()
//     });
// });
// app.on("destroy", () => {
//     module.showRouter.destroy();
// });
export default module;
