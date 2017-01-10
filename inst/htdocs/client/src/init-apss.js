/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "bootstrap/less/bootstrap.less!";
// include it explicitly to allow LESS builder to adjust urls
import "bootstrap/less/sprites.less!";
import "bootstrap/less/responsive.less!";
import "polyfills/fix-bootstrap-v2-mixin.less!";
import "font-awesome/css/font-awesome.css!less";

import $ from "jquery";
import Backbone from "backbone";
import app from "app";
import config from "config";
import AppView from "Common/App/show/layoutview/AppView";
import AppModel from "Common/App/models/AppModel";
import PageCollection from "Common/Pages/models/PageCollection";
import commonApp from "Common/common-app";
import apssApp from "AnalysisPageServerStatic/apss-app";
/*
 * @see EXPRESSIONPLOT-332
 * "|" contained in some names was incorrectly interpreted as array item separator
 */
Backbone.Router.arrayValueSplit = "|||";


app.on("start", function() {

    commonApp.start();
    apssApp.start();

    var appModel = new AppModel({
        id:     "main",
        env:    "analysis-page-server-static"
    });
    app.channel.request("app:model:initialize", appModel);

    var pages = new PageCollection(null, {
        appModel:   appModel
    });

    app.channel.request("pages:collection:set", pages);

    var $containers = $("body").find(".ep-analysis-page-data-set");

    // ensure there is a modal region in the body
    $("[data-modal-region]").length || $("body").append($("<div data-modal-region></div>"));
    $("[data-main-region]").length || $("body").prepend($("<div data-main-region></div>"));

    var appView = new AppView({
        model: appModel,
        title: "AnalysisPageServerStatic",
        pageTitlePrefix: ""
    });

    app.channel.request("app:view:initialize", appView);

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

    if (! Backbone.history.start()) {
        app.channel.request("app:view:show-modal", {
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
