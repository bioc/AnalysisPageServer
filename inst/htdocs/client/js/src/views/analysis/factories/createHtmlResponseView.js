/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "functions/apss/embeddable/mapContainersToDatasets",
    "functions/apss/mapDatasetsToPages", 
    "functions/apss/showPages",
    "collections/PageCollection"], 
function(Backbone, 
mapContainersToDatasets, mapDatasetsToPages, showPages, PageCollection) {
    return function(definition, options) {
        /*
         * The process of finding containers for analysis datasets is similar
         * here to analysis page server static in embeddable mode.
         * Check also init-apss.js
         */
        var $responseContainer = $("<div></div>");
        $responseContainer.html(definition.value);
        var $containers = $responseContainer.find(".ep-analysis-page-data-set");
        
        var datasets = mapContainersToDatasets($containers);
        
        datasets = _.map(datasets, function(dataset) {
            // indicate that this AnalysisPageModel is only a dataset thus does not act
            // as regular AnalysisPageModel with parameters, FormViews, and appearing in menus
            return _.extend(dataset, {
                "aps-analysis-dataset": true
            });
        });
        
        // create temporary PageCollection
        var analysisPages = new PageCollection(null, {
            appModel: options.appView.model,
            parentPageModel: options.pageModel
        });
        // on new analysis fetch dispose this temporary collection
        var analysisE = options.pageModel.collection.asEventStream("page:analysis:fetch").take(1);
        analysisE.onValue(analysisPages, "reset", null, null);
        
        mapDatasetsToPages(datasets, {pages: analysisPages, appView: options.appView});

        showPages(analysisPages, _.extend(
                // passing here createPageView as recursive PageView creation is likely
                _.pick(options, ["appView", "createPageView"]), 
                {$containers: $containers}
                        ));
        
        return new Backbone.View({
                el: $responseContainer
        });
    }
});