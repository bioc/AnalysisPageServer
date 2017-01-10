/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
// import app from "app";
import ShowController from "./show/TablesShowController";
import DownloadController from "./download/TableDataDownloadController";
import TableDataWorkerProvider from "./TableDataWorkerProvider";
import theadApp from "./Thead/thead-app";
import tbodyApp from "./Tbody/tbody-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.tableDataWorkerP = new TableDataWorkerProvider();
        module.showC = new ShowController();
        module.downloadC = new DownloadController();
        theadApp.start();
        tbodyApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.tableDataWorkerP.destroy();
        module.showC.destroy();
        module.downloadC.destroy();
        theadApp.stop();
        tbodyApp.stop();
    }
};

// app.on("before:start", () => {
//     module.tableDataWorkerP = new TableDataWorkerProvider();
//     module.showC = new ShowController();
//     module.downloadC = new DownloadController();
// });
// app.on("destroy", () => {
//     module.tableDataWorkerP.destroy();
//     module.showC.destroy();
//     module.downloadC.destroy();
// });

export default module;
