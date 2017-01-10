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
import apsApp from "./AnalysisPageServer/aps-app";
import commonApp from "./Common/common-app";
import landingPageApp from "./AnalysisPageServer/Pages/Landing/aps-landingpage-app";

/*
 * @see EXPRESSIONPLOT-332
 * "|" contained in some names was incorrectly interpreted as array item separator
 */
Backbone.Router.arrayValueSplit = "|||";

app.on("start", function() {

    apsApp.start();
    commonApp.start();
    landingPageApp.start();

    var appModel = new AppModel({
        id:     "main",
        env:    "analysis-page-server"
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
    });

    app.channel.request("pages:collection:set", pages);

    var appView = new AppView({
        pages:          pages,
        model:          appModel,
        el:             "body",
        title:          "AnalysisPageServer",
        pageTitlePrefix:""
    });

    app.channel.request("app:view:initialize", appView);
    app.channel.request("header:view:initialize");

    if (! Backbone.history.start({root: config["history.root"]})) {
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
            fullErrorText:  "AnalysisPageServer was unable to parse the provided link.\n\n"+
                            window.location.href+
                            "\n\n Either it was pasted with error or there is a bug in the app.",
            pageModel:      pages.get("landing")
        });
    }
});

app.start();
