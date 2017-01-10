/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
// import app from "app";
import AppShowController from "./show/AppShowController";
import ModalShowController from "./show/ModalShowController";
import AppModelController from "./AppModelController";
import headerApp from "./Header/header-app";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.appModelC = new AppModelController();
        module.modalShowC = new ModalShowController();
        module.appShowC = new AppShowController({
            appView: null,
            modalController: module.modalShowC
        });

        headerApp.start();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.appShowC.destroy();
        module.appModelC.destroy();
        module.modalShowC.destroy();
        headerApp.stop();
    }
};

// app.on("before:start", () => {
//     module.appModelC = new AppModelController();
//     module.modalShowC = new ModalShowController();
//     module.appShowC = new AppShowController({
//         appView: null,
//         modalController: module.modalShowC
//     });
// });
//
// app.on("destroy", () => {
//     module.appShowC.destroy();
//     module.appModelC.destroy();
//     module.modalShowC.destroy();
// });

export default module;
