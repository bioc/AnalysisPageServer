/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import _ from "underscore";
import app from "app";
import DatasetView from "./layoutview/DatasetView";
import DatasetsView from "./collectionview/DatasetsView";
import fixedEncodeURIComponent from "functions/fixedEncodeURIComponent";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.on("table-data:worker:security-error", () => {
            app.channel.request("app:view:show-modal", {
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
    },
    onDestroy() {
        app.channel.off("table-data:worker:security-error");
    },
    showEmbedded() {
        var appView = app.channel.request("app:view");
        app.channel.request("apss:embedded-datasets:app:view:initialize", appView);
        var pages = app.channel.request("pages:collection");
        var datasetRegions = _.reduce(appView.getRegions(), (memo, region, name) => {
            if (name.match(/embeddedDataset/)) {
                memo.push(region);
            }
            return memo;
        }, []);
        pages.set(_.map(datasetRegions, region => this._parseEmbeddedAttributes(region), this));
        this._addCommonPageAttributes(pages);
        pages.setActive(pages.at(0));
        this._showEmbeddedDatasets(pages);
        if (pages.size() === 0) {
            this._showNoEmbeddedDatasetsModal();
        }
    },
    _showNoEmbeddedDatasetsModal() {
        var appView = app.channel.request("app:view");
        app.channel.request("app:view:show-modal", {
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
        app.channel.request("app:view:show-main", new Marionette.ItemView({
            template: false,
            el: "<div><p class='text-center muted'>Sorry, nothing to show :(</p></div>"
        }), "AnalysisPageServerStatic");
    },
    _parseEmbeddedAttributes(region) {
        return {
            tableVisible: region.$el.attr("data-set") &&
                        (! region.$el.is("[data-table-visible]")
                        || region.$el.attr("data-table-visible") == "yes"),
            tableRows: parseInt(region.$el.attr("data-table-rows")) || 30,
            sidebarVisible: ! region.$el.is("[data-sidebar-visible]")
                    || region.$el.attr("data-sidebar-visible") == "yes",
            plotZoomable: ! region.$el.is("[data-plot-zoomable]")
                    || region.$el.attr("data-plot-zoomable") == "yes",
            plotHeight: parseFloat(region.$el.attr("data-plot-height")) || "auto",
            data_url: region.$el.attr("data-set"),
            plot_url: region.$el.attr("data-svg"),
            apssEmbeddedDataset: true
        };
    },
    _addCommonPageAttributes(pages) {
        pages.each(page => {
            page.set({
                in_menu: true,
                name: _.uniqueId("dataset-"),
                label: "Loading...",
                apss: true
            });
        });
    },
    showFromUrl(queryString) {
        var appView = app.channel.request("app:view");
        var pages = this._parseUrlDatasets(queryString);
        app.channel.request("header:view:initialize");
        app.channel.request("apss:url-datasets:app:view:initialize", appView);
        this._addCommonPageAttributes(pages);
        pages.setActive(pages.at(0));
        this._showUrlDatasets(pages);
    },
    _parseUrlDatasets(queryString) {
        var datasetRegExp = /dataset(\d{1,2})/;
        var pages = app.channel.request("pages:collection");
        pages.reset();
        if (! _.isString(queryString)) return pages;
        var page = null;
        _.each(queryString.split("&"), datasetProp => {
            var nameValPair = datasetProp.split("=");
            var pageIdx = nameValPair[0].match(datasetRegExp)[1] - 1;// dec by one
            var propName = nameValPair[0].split(".")[1];
            page = pages.at(pageIdx);
            page || (page = pages.add({}, {at: pageIdx}));
            page.set(propName, nameValPair[1]);
        });
        return pages;
    },
    _showEmbeddedDatasets(pages) {
        var appView = app.channel.request("app:view");
        pages.each((page, i) => {
            var v = new DatasetView({
                model: page
            });
            appView.showChildView("embeddedDataset"+i, v);
        }, this);
        this._fetchAnalyses(pages);
    },
    _showUrlDatasets(pages) {
        var v = new DatasetsView({
            collection: pages
        });
        var promise = app.channel.request("app:view:show-main", v, "Datasets");
        promise.then(() => this._fetchAnalyses(pages)).then(
            // all analyses fetched & rendered
            () => app.channel.request("apss:app:view:initialize-scrollspy")
        );
    },
    _fetchAnalyses(pages) {
        var appView = app.channel.request("app:view");
        return Promise.all(pages.map((page, i) => {
            var promise = app.channel.request("pages:analysis:fetch", page);
            return promise.then((analysis) => {
                var v = app.channel.request("analysis-data:views:"+analysis.type, analysis, {
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
            .catch(responseText => {
                app.channel.request("app:view:show-modal", {
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
