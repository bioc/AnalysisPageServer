/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import Controller from "./PrimaryPageShowController";

export default Marionette.AppRouter.extend({
    controller: new Controller(),
    appRoutes: {
        "page/:page/primary(/:params)": "show"
    }
});
