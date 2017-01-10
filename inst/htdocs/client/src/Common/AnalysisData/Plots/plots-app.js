/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
// import app from "app";
import ShowController from "./show/PlotsShowController";
import SettingsController from "./SettingsModelController";
import menuApp from "./SideMenu/menu-app";
import svgApp from "./Svg/svg-app";
import sidebarApp from "./Sidebar/sidebar-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.showC = new ShowController();
        module.settingsC = new SettingsController();
        menuApp.start();
        svgApp.start();
        sidebarApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.showC.destroy();
        module.settingsC.destroy();
        menuApp.stop();
        svgApp.stop();
        sidebarApp.stop();
    }
};

// app.on("before:start", () => {
//     module.showC = new ShowController();
//     module.settingsC = new SettingsController();
// });
// app.on("destroy", () => {
//     module.showC.destroy();
//     module.settingsC.destroy();
// });

export default module;
