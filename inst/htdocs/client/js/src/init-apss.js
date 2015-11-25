/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
requirejs.onError = function(err) {
    if (window.location.protocol === "file:"
            && err.requireModules && err.requireModules.length
            && err.requireModules[0].indexOf("requirejs-web-workers!") === 0) {

        require(["jquery", "marionette", "backbone", "app",
            "Common/App/models/AppModel", "Common/App/show/layoutview/AppView"],
        function($, Marionette, Backbone, app, AppModel, AppView) {

            // ensure there is a modal region in the body
            $("[data-modal-region]").length || $("body").append($("<div data-modal-region></div>"));

            var globalChannel = Backbone.Wreqr.radio.channel("global");

            var appModel = new AppModel({
                id:     "main",
                env:    "analysis-page-server-static"
            });

            globalChannel.commands.execute("app:model:initialize", appModel);

            var appView = new AppView({
                model: appModel,
                title: "AnalysisPageServerStatic",
                pageTitlePrefix: ""
            });

            globalChannel.commands.execute("app:view:initialize", appView);

            app.on("start", function() {
                globalChannel.reqres.request("app:view:show-main", new Marionette.ItemView({
                    template: false,
                    el: "<div><p class='text-center muted'>Sorry, nothing to show :(</p></div>"
                }), "Local Deployment Error");
                globalChannel.reqres.request("app:view:show-modal", {
                    type: "error",
                    title: "Local Deployment Error",
                    cancelBtnLabel: "Close",
                    fullErrorHtml:
                            "<p>"+
                            "Your browser is running in a mode which does not allow "+
                            "access to local data files necessary to display this report. "+
                            "Please see the <a target='_blank' href='http://bioconductor.org/packages/release/bioc/vignettes/AnalysisPageServer/inst/doc/AnalysisPageServer.html#toc_3'>"+
                            "AnalysisPageServer vignette</a> for instructions on how to turn off this restriction so you can see this report."+
                            "</p>"
                });
            });

            app.start();
        });
    }
};

require(["jquery", "backbone", "app", "config", "Common/App/show/layoutview/AppView",
    "Common/App/models/AppModel",
    "Common/Pages/models/PageCollection",
    "promise-polyfill",
    "TemplateCache.mod",
    "./AnalysisPageServerStatic/apss-app",
    "./Common/common-app"],
    function($, Backbone, app, config, AppView, AppModel, PageCollection) {

    /*
     * @see EXPRESSIONPLOT-332
     * "|" contained in some names was incorrectly interpreted as array item separator
     */
    Backbone.Router.arrayValueSplit = "|||";

    var globalChannel = Backbone.Wreqr.radio.channel("global");

    var appModel = new AppModel({
        id:     "main",
        env:    "analysis-page-server-static"
    });

    globalChannel.commands.execute("app:model:initialize", appModel);

    var pages = new PageCollection(null, {
        appModel:   appModel
    });

    globalChannel.commands.execute("pages:collection:set", pages);

    var $containers = $("body").find(".ep-analysis-page-data-set");

    // ensure there is a modal region in the body
    $("[data-modal-region]").length || $("body").append($("<div data-modal-region></div>"));

    var appView = new AppView({
        model: appModel,
        title: "AnalysisPageServerStatic",
        pageTitlePrefix: ""
    });

    globalChannel.commands.execute("app:view:initialize", appView);

    var historyErrorText;

    if ($containers.length) {

        historyErrorText = "Some error occured.";
    }
    else {

        historyErrorText = "AnalysisPageServerStatic was unable to parse the provided link:\n\n"+
                            window.location.href+
                            "\n\nValid format for URL is:\n\n"+
                            "<pre>#datasets?dataset1.data_url=DATA_URL(&dataset1.plot_url=PLOT_URL)\n\n"+
                            "(&dataset2.data_url=DATA_URL(&dataset2.plot_url=PLOT_URL))</pre>\n\n"+
                            "where parts in brackets are optional\n\n"+
                            "and there may be one or more datasets.\n\n"+
                            "DATA_URL and PLOT_URL should be url-encoded.";
    }

    app.on("start", function() {
        if (! Backbone.history.start()) {
            globalChannel.reqres.request("app:view:show-modal", {
                type: "error",
                backdrop: false,
                withClose: true,
                title: "Oops, an error occured",
                doBtnLabel: "Send an email about this?",
                cancelBtnLabel: "Cancel",
                fullErrorHtml: historyErrorText
            });
        }
        else {

        }
    });

    app.start();

});
