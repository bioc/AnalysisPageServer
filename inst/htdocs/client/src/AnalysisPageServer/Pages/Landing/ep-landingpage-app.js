/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import LandingPageShowRouter from "./show/LandingPageShowRouter";
import ShowController from "./show/EPLandingPageShowController";
import EPStudyFormShowController from "./show/EPStudyFormShowController";
import tooloverviewApp from "./ToolOverview/tooloverview-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        tooloverviewApp.start();
        module.showRouter = new LandingPageShowRouter({
            controller: new ShowController()
        });
        module.studyFormC = new EPStudyFormShowController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        tooloverviewApp.stop();
        module.showRouter.destroy();
        module.studyFormC.destroy();
    }
};

// app.on("before:start", () => {
//     module.showRouter = new LandingPageShowRouter({
//         controller: new ShowController()
//     });
//     module.studyFormC = new EPStudyFormShowController();
// });
// app.on("destroy", () => {
//     module.showRouter.destroy();
//     module.studyFormC.destroy();
// });

export default module;
