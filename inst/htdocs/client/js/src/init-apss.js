/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
requirejs.onError = function(err) {
    if (window.location.protocol === "file:" 
            && err.requireModules && err.requireModules.length 
            && err.requireModules[0].indexOf("worker!") === 0) {
        
        require(["jquery", "views/modals/createModalView"], function($, createModalView) {
            $("#ep-intro-row").remove();
            var modal = createModalView({
                modalType:      "error",
                className:      "modal hide fade",
                title:          "Local Deployment Error",
                fullErrorText:
                        "You tried to run AnalysisPageServerStatic locally\n"+
                        "in a browser that does not allow web apps\n"+
                        "to access local files.\n\n"+
                        "Please open this page in a browser which does\n"+
                        "not have this restriction, such as Safari or Firefox.\n\n"+
                        "If you are using Chrome then you could close all\n"+
                        "the Chrome windows and restart it from the terminal with\n"+
                        "the '--allow-file-access-from-files' flag."
            });
            $("body").append(modal.$el);
            modal.render();
        });
            }
};

require(["jquery", "backbone", "bacon", "config", "views/AppView", "models/AppModel",
    "collections/PageCollection", 
    "routers/apss/MainRouter",
    "views/HeaderView", "views/FooterView",
    "functions/apss/embeddable/mapContainersToDatasets",
    "functions/apss/mapDatasetsToPages",
    "functions/apss/showPages",
    "views/pages/createPageView",],
//    "backbone.syncOverride"],
    function($, Backbone, Bacon, config, AppView, AppModel, PageCollection, MainRouter,
    HeaderView, FooterView, mapContainersToDatasets, mapDatasetsToPages, showPages, createPageView) {

    /*
     * @see EXPRESSIONPLOT-332
     * "|" contained in some names was incorrectly interpreted as array item separator
     */
    Backbone.Router.arrayValueSplit = "|||";

    var eventBus = new Bacon.Bus();

    var appModel = new AppModel({
        id:     "main",
        env:    "analysis-page-server-static"
    });

    var pages = new PageCollection(null, {
        appModel:   appModel
    });
    /*
     * This branch of rendering datasets is similar to analysis page server
     * with analysis html-type response.
     * Check out createHtmlResponseView.js
     */
    var $containers = $("body").find(".ep-analysis-page-data-set");
    
    var datasets = mapContainersToDatasets($containers);
    
    var appView, header, footer, router;
    
    if (datasets.length) {
        // there is at least one dataset container in the body of html file
        // so go the "embeddable" way
        appView = new AppView({
            eventBus:       eventBus,
            pages:          pages,
            model:          appModel,
            el:             "body",
            withNavbarFixedTop: false,
            title:              "AnalysisPageServerStatic",
            pageTitlePrefix:    ""
        });
        
        mapDatasetsToPages(datasets, {pages: pages, appView: appView});
        
        showPages(pages, {appView: appView, $containers: $containers, createPageView: createPageView});
        
    }
    else {
        // full static deployment
        appView = new AppView({
            eventBus:       eventBus,
            pages:          pages,
            model:          appModel,
            el:             "body",
            withNavbarFixedTop: true,
            title:              "AnalysisPageServerStatic",
            pageTitlePrefix:    ""
        });

        header = new HeaderView({
            el:         "header",
            fixedTop:   true,
            pages:      pages,
            appView:    appView,
            appModel:   appModel,
            eventBus:   eventBus
        });
        header.render();

        footer = new FooterView({
            el:         "footer"
        });

        router = new MainRouter({
            appView:    appView,
            pages:      pages,
            eventBus:   eventBus
        });

        $("#ep-intro-row").remove();
        
        if (! Backbone.history.start({root: config["history.root"]})) {
            appView.showModalWindow({
                modalType:      "error",
                backdrop:       false,
                withClose:      true,
                title:          "Oops, an error occured",
                doBtnLabel:     "Send an email about this?",
                cancelBtnLabel: "Cancel",
                fullErrorText:  "AnalysisPageServerStatic was unable to parse the provided link:\n\n"+
                                window.location.href+
                                "\n\nValid format for URL is:\n\n"+
                                "#datasets?dataset1.data_url=DATA_URL(&dataset1.plot_url=PLOT_URL)\n\n"+
                                "(&dataset2.data_url=DATA_URL(&dataset2.plot_url=PLOT_URL))\n\n"+
                                "where parts in brackets are optional\n\n"+
                                "and there may be one or more datasets.\n\n"+
                                "DATA_URL and PLOT_URL should be url-encoded."
            });
        }
    }
    
    
    
    
});