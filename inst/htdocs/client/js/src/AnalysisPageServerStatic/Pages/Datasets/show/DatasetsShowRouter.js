/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./DatasetsShowController"], 
function(Marionette, Controller) {
    return Marionette.AppRouter.extend({
        controller: new Controller(),
        appRoutes: {
            "": "showEmbedded",
            "datasets": "showFromUrl"
        }
    });
});
