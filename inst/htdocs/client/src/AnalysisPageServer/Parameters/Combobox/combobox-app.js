/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import ShowController from "./show/ComboboxShowController";
import SuggestionsCallbackController from "./SuggestionsCallbackController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.showC = new ShowController();
        module.suggestionsCallbackC = new SuggestionsCallbackController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.showC.destroy();
        module.suggestionsCallbackC.destroy();
    }
};

// app.on("before:start", () => {
//     module.showC = new ShowController();
//     module.suggestionsCallbackC = new SuggestionsCallbackController();
// });
// app.on("destroy", () => {
//     module.showC.destroy();
//     module.suggestionsCallbackC.destroy();
// });

export default module;
