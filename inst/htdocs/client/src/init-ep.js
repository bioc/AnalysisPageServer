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

import Backbone from "backbone";
import app from "app";
import Bacon from "bacon";
import config from "config";
import AppView from "Common/App/show/layoutview/AppView";
import AppModel from "Common/App/models/AppModel";
import PageCollection from "Common/Pages/models/PageCollection";
import AnalyticsFacade from "analytics/AnalyticsFacade";
import apsApp from "./AnalysisPageServer/aps-app";
import commonApp from "./Common/common-app";
import landingPageApp from "./AnalysisPageServer/Pages/Landing/ep-landingpage-app";

/*
 * @see EXPRESSIONPLOT-332
 * "|" contained in some names was incorrectly interpreted as array item separator
 */
Backbone.Router.arrayValueSplit = "|||";
Backbone.Radio.DEBUG = true;


app.on("start", function() {

    apsApp.start();
    commonApp.start();
    landingPageApp.start();

    var appModel = new AppModel({
        id:     "main",
        env:    "expressionplot"
    });

    app.channel.request("app:model:initialize", appModel);

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

    app.channel.request("pages:collection:set", pages);

    var appView = new AppView({
        pages:          pages,
        model:          appModel,
        el:             "body",
        title:          "ExpressionPlot",
        pageTitlePrefix:"EP - "
    });

    app.channel.request("app:view:initialize", appView);
    app.channel.request("header:view:initialize");

    if (! Backbone.history.start()) {
        app.channel.request("app:view:show-main", new Marionette.ItemView({
            template: false,
            el: "<div><p class='text-center muted'>Sorry, nothing to show :(</p></div>"
        }), "Unable to parse the provided link.");
        app.channel.request("app:view:show-modal", {
            type: "error",
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
    else {
        var promise = app.channel.request("pages:analysis:fetch", pages.get("IP"), {trackSuccess: false});
        promise.then(ip => AnalyticsFacade.setCustomVariable("dimension1", ip));
    }
});

app.start();
