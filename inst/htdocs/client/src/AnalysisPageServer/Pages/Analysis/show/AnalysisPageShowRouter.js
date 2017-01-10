/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import Controller from "./AnalysisPageShowController";

export default Marionette.AppRouter.extend({
    controller: new Controller(),
    appRoutes: {
        "page/:page/analysis(/:params)": "show"
    }
});
