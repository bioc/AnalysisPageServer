/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import "velocity/velocity.ui";

export default Marionette.Controller.extend({
    initialize: function(opts) {
        app.channel.reply("apss:embedded-datasets:app:view:initialize", this.initializeEmbeddedDatasetsAppView, this);
        app.channel.reply("apss:url-datasets:app:view:initialize", this.initializeUrlDatasetsAppView, this);
        app.channel.reply("apss:app:view:select-dataset", this.selectUrlDataset, this);
        app.channel.reply("apss:app:view:initialize-scrollspy", this.initializeScrollspy, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("apss:embedded-datasets:app:view:initialize");
        app.channel.stopReplying("apss:url-datasets:app:view:initialize");
        app.channel.stopReplying("apss:app:view:select-dataset");
        app.channel.stopReplying("apss:app:view:initialize-scrollspy");
    },
    initializeEmbeddedDatasetsAppView: function(appView) {
        this.appView = appView;
        // dynamically add regions
        appView.$(".ep-analysis-page-data-set").each(function(i) {
            appView.addRegion("embeddedDataset"+i, {
                el: this
            });
        });
    },
    initializeUrlDatasetsAppView: function(appView) {
        this.appView = appView;
        appView.setWithNavbarFixedTop(true);
    },
    /**
     * Scrollspy is initialized for standalone deployments of EP
     * where multiple "pages" display in one physical document
     * @returns {undefined}
     */
    initializeScrollspy: function() {
        this.appView.$el.scrollspy({
            target: "header",
            offset: 70
        });
    },
    selectUrlDataset: function(pageModel, withScroll) {
        var pages = app.channel.request("pages:collection");
        var datasetView = this.appView.getChildView("main")
                .children
                .findByModel(pageModel);
        if (datasetView) {
            pages.setActive(pageModel);
            this.appView.setTitle(pageModel.get("label"));
            if (withScroll) {
                var o = datasetView.$el.offset();
                o && o.top && $(window).scrollTop(o.top-70);
            }
        }
        else {

        }
    }
});
