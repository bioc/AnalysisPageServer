/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "velocity.ui"], 
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function(opts) {
            this.getCommands().setHandler("apss:embedded-datasets:app:view:initialize", this.initializeEmbeddedDatasetsAppView, this);
            this.getCommands().setHandler("apss:url-datasets:app:view:initialize", this.initializeUrlDatasetsAppView, this);
            this.getCommands().setHandler("apss:app:view:select-dataset", this.selectUrlDataset, this);
            this.getCommands().setHandler("apss:app:view:initialize-scrollspy", this.initializeScrollspy, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
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
            var pages = this.getReqRes().request("pages:collection");
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
});