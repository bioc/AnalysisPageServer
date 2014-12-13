/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon",
    "functions/apss/mapDatasetsToPages",
    "functions/apss/showPages", "views/pages/createPageView",
    "backbone-query-parameters"], function(Backbone, Bacon, mapDatasetsToPages, showPages, createPageView) {
    var Main = Backbone.Router.extend({
        routes:     {
            "datasets":    "showAnalyses"
        },
        initialize: function(opts) {
            this.createPageView = createPageView;
            this.eventBus = opts.eventBus;
            this.pages = opts.pages;
            this.appView = opts.appView;
            this.labelsSetESArray = [];
        },
        initializeEventBus: function() {
            function navigateToPageView(router, e) {
                router.appView.selectPageView(e.pageModel);
            }
            this.eventBus
                    .filter(".router")
                    .filter(".navigateToPageView")
                    .onValue(navigateToPageView, this);
        },
        showAnalyses:   function(parameterHash) {
            // keys are unimportant
            var datasets = _.values(parameterHash);
            // datasets act as "pages"
            mapDatasetsToPages(datasets, _.pick(this, ["pages", "appView"]));

            this.appView.removePageViews();

            showPages(this.pages, _.pick(this, ["appView", "createPageView"]));

        }        
    });
    return Main;
});