/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./PrimaryPageShowController"], function(Marionette, Controller) {
    return Marionette.AppRouter.extend({
        controller: new Controller(),
        appRoutes: {
            "page/:page/primary(/:params)": "show"
        }
    });
});