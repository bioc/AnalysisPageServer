/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
require(["backbone", "app", "bacon", "config", "Common/App/show/layoutview/AppView", 
    "Common/App/models/AppModel",
    "Common/Pages/models/PageCollection", 
    "promise-polyfill",
    "TemplateCache.mod",
    "./AnalysisPageServer/aps-app",
    "./Common/common-app", "./AnalysisPageServer/Pages/Landing/aps-landingpage-app"],
    function(Backbone, app, Bacon, config, AppView, AppModel, PageCollection) {

    /*
     * @see EXPRESSIONPLOT-332
     * "|" contained in some names was incorrectly interpreted as array item separator
     */
    Backbone.Router.arrayValueSplit = "|||";

    var globalChannel = Backbone.Wreqr.radio.channel("global");

    var appModel = new AppModel({
        id:     "main",
        env:    "analysis-page-server"
    });

    globalChannel.commands.execute("app:model:initialize", appModel);

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
    });
    
    globalChannel.commands.execute("pages:collection:set", pages);
    
    var appView = new AppView({
        pages:          pages,
        model:          appModel,
        el:             "body",
        title:          "AnalysisPageServer",
        pageTitlePrefix:""
    });
    
    globalChannel.commands.execute("app:view:initialize", appView);
    globalChannel.commands.execute("header:view:initialize");
       
    app.on("start", function() {
        if (! Backbone.history.start({root: config["history.root"]})) {
            globalChannel.reqres.request("app:view:show-modal", {
                type: "error",
                backdrop:       false,
                withClose:      true,
                title:          "Oops, an error occured",
                doBtnLabel:     "Send an email about this?",
                cancelBtnLabel: "Cancel",
                fullErrorText:  "AnalysisPageServer was unable to parse the provided link.\n\n"+
                                window.location.href+
                                "\n\n Either it was pasted with error or there is a bug in the app.",
                pageModel:      pages.get("landing")
            });
        }
    });
       
    app.start();
    
});