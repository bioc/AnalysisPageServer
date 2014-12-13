/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
require(["backbone", "bacon", "config", "views/AppView", "models/AppModel",
    "collections/PageCollection", 
    "routers/MainRouter",
    "analytics/AnalyticsFacade",
    "views/HeaderView", "views/FooterView",],
//    "backbone.syncOverride"],
    function(Backbone, Bacon, config, AppView, AppModel, PageCollection,
    MainRouter,
    AnalyticsFacade,
    HeaderView, FooterView) {

    /*
     * @see EXPRESSIONPLOT-332
     * "|" contained in some names was incorrectly interpreted as array item separator
     */
    Backbone.Router.arrayValueSplit = "|||";

    var eventBus = new Bacon.Bus();

    var appModel = new AppModel({
        id:     "main",
        env:    "expressionplot"
    });

    var pages = new PageCollection(null, {
        appModel:   appModel
    });
    pages.create({
        active:     true,
        hidden:     true,
        in_menu:    false,
        advanced:   false,
        label:      "Landing Page",
        name:       "landing"
    }, {
        appModel:   appModel
    });
    
    /*
     * IP resource is part of "analysis" resource so it makes sense to 
     * model it as another AnalysisPageModel
     */
    pages.create({
        active:     true,
        hidden:     true,
        in_menu:    false,
        advanced:   false,
        name:       "IP"
    }, {
        appModel:   appModel
    });
    pages.get("IP").fetchAnalysis({navigate: false, trackSuccess: false})
            .take(1)
            .onValue(function(ip) {
                AnalyticsFacade.setCustomVariable(1, "IP", ip, 1/*visitor-level*/);
            });
    
    
    
    var appView = new AppView({
        eventBus:       eventBus,
        pages:          pages,
        model:          appModel,
        el:             "body",
        title:          "ExpressionPlot",
        pageTitlePrefix:"EP - "
    });
    
    var header = new HeaderView({
        el:         "header",
        pages:      pages,
        appModel:   appModel,
        appView:    appView,
        eventBus:   eventBus
    });
    header.render();
    
    var footer = new FooterView({
        el:         "footer"
    });
    
    var router = new MainRouter({
        eventBus:   eventBus,
        pages:      pages,
        appView:    appView
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
            fullErrorText:  "ExpressionPlot was unable to parse the provided link.\n\n"+
                            window.location.href+
                            "\n\n Either it was pasted with error or there is a bug in the app.",
            pageModel:      pages.get("landing")
        });
    }
    
});