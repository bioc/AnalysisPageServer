/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/DatasetView", "./collectionview/DatasetsView",
"functions/fixedEncodeURIComponent"],
function(Marionette, DatasetView, DatasetsView, fixedEncodeURIComponent) {
    return Marionette.Controller.extend({
        initialize: function() {

        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        showEmbedded: function() {
            var appView = this.getReqRes().request("app:view");
            this.getCommands().execute("apss:embedded-datasets:app:view:initialize", appView);
            var pages = this.getReqRes().request("pages:collection");
            var datasetRegions = _.reduce(appView.getRegions(), function(memo, region, name) {
                if (name.match(/embeddedDataset/)) {
                    memo.push(region);
                }
                return memo;
            }, []);
            pages.set(_.map(datasetRegions, function(region) {
                return this._parseEmbeddedAttributes(region);
            }, this));
            this._addCommonPageAttributes(pages);
            pages.setActive(pages.at(0));
            this._showEmbeddedDatasets(pages);
            if (pages.size() === 0) {
                this._showNoEmbeddedDatasetsModal();
            }
        },
        _showNoEmbeddedDatasetsModal: function() {
            var appView = this.getReqRes().request("app:view");
            this.getReqRes().request("app:view:show-modal", {
                type: "error",
                title: "Oops, an error occured",
                doBtnLabel: "Send an email about this?",
                cancelBtnLabel: "Cancel",
                fullErrorHtml: "There are no embedded datasets in the html document."+
                        " Maybe you wanted to run static deployment with datasets "+
                        "coming from URL? In that case append <pre>#datasets?dataset1.data_url=DATA_URL(&dataset1.plot_url=PLOT_URL)"+
                        "(&dataset2.data_url=DATA_URL(&dataset2.plot_url=PLOT_URL))</pre> in the location bar.",
                model: null,
                permalink: window.location.href
            });
            this.getReqRes().request("app:view:show-main", new Marionette.ItemView({
                template: false,
                el: "<div><p class='text-center muted'>Sorry, nothing to show :(</p></div>"
            }), "AnalysisPageServerStatic");
        },
        _parseEmbeddedAttributes: function(region) {
            return {
                tableVisible: region.$el.attr("data-set") &&
                            (! region.$el.is("[data-table-visible]")
                            || region.$el.attr("data-table-visible") == "yes"),
                tableRows: parseInt(region.$el.attr("data-table-rows")) || 30,
                sidebarVisible: ! region.$el.is("[data-sidebar-visible]")
                        || region.$el.attr("data-sidebar-visible") == "yes",
                data_url: region.$el.attr("data-set"),
                plot_url: region.$el.attr("data-svg"),
                apssEmbeddedDataset: true
            };
        },
        _addCommonPageAttributes: function(pages) {
            pages.each(function(page) {
                page.set({
                    in_menu: true,
                    name: _.uniqueId("dataset-"),
                    label: "Loading...",
                    apss: true
                });
            });
        },
        showFromUrl: function(queryString) {
            var appView = this.getReqRes().request("app:view");
            var pages = this._parseUrlDatasets(queryString);
            this.getCommands().execute("header:view:initialize");
            this.getCommands().execute("apss:url-datasets:app:view:initialize", appView);
            this._addCommonPageAttributes(pages);
            pages.setActive(pages.at(0));
            this._showUrlDatasets(pages);
        },
        _parseUrlDatasets: function(queryString) {
            var datasetRegExp = /dataset(\d{1,2})/;
            var pages = this.getReqRes().request("pages:collection");
            pages.reset();
            var page = null;
            _.each(queryString.split("&"), function(datasetProp) {
                var nameValPair = datasetProp.split("=");
                var pageIdx = nameValPair[0].match(datasetRegExp)[1] - 1;// dec by one
                var propName = nameValPair[0].split(".")[1];
                page = pages.at(pageIdx);
                page || (page = pages.add({}, {at: pageIdx}));
                page.set(propName, nameValPair[1]);
            });
            return pages;
        },
        _showEmbeddedDatasets: function(pages) {
            var appView = this.getReqRes().request("app:view");
            pages.each(function(page, i) {
                var v = new DatasetView({
                    model: page
                });
                appView.showChildView("embeddedDataset"+i, v);
            }, this);
            this._fetchAnalyses(pages);
        },
        _showUrlDatasets: function(pages) {
            var self = this;
            var v = new DatasetsView({
                collection: pages
            });
            var promise = this.getReqRes().request("app:view:show-main", v, "Datasets");
            promise.then(function() {
                return self._fetchAnalyses(pages);
            }).then(function() {
                // all analyses fetched & rendered
                self.getCommands().execute("apss:app:view:initialize-scrollspy");
            });
        },
        _fetchAnalyses: function(pages) {
            var appView = this.getReqRes().request("app:view");
            var self = this;
            return Promise.all(pages.map(function(page, i) {
                var promise = this.getReqRes().request("pages:analysis:fetch", page);
                return promise.then(function(analysis) {
                    var v = self.getReqRes().request("analysis-data:views:"+analysis.type, analysis, {
                        isRoot: true,
                        pageModel: page
                    });
                    if (page.get("apssEmbeddedDataset")) {
                        appView.getChildView("embeddedDataset"+i)
                                .showChildView("analysis", v);
                    }
                    else {
                        appView.getChildView("main")
                                .children
                                .findByModel(page)
                                .showChildView("analysis", v);
                    }
                })
                .catch(function(responseText) {
                    self.getReqRes().request("app:view:show-modal", {
                        type: "error",
                        title: "Oops, an error occured",
                        doBtnLabel: "Send an email about this?",
                        cancelBtnLabel: "Cancel",
                        fullErrorText: responseText || "Couldn't load dataset no. "+i,
                        model: page,
                        permalink: window.location.href
                    });
                });
            }, this));
        }
    });
});
