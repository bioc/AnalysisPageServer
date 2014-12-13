/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon"], function(Bacon) {
    
    function useCaptionAsLabel(page, a) {
        if (! a) return;
        switch (a.type) {
            case "plot":
                page.get("label") || page.set("label", a.value.table.value.caption);
                page.set("topmostCaption", a.value.table.value.caption);
                break;
            case "table":
                page.get("label") || page.set("label", a.value.caption);
                page.set("topmostCaption", a.value.caption);
                break;
        }
    }
    function overwritePlotEntry(plotUrl, a) {
        a.type && a.type === "plot" && a.value && a.value.plot && (a.value.plot = plotUrl);
        return a;
    }
    function toShownES(pageView) {
        pageView.showWithAnimation();
        return pageView.asEventStream("shown").take(1);
    }
    
    function mapToPageView(opts, analysis) {
        var pv;
        pv = opts.createPageView(_.extend(opts, {
            type: "secondary",
            perChunk: 10,
            analysis: analysis
        }));
        opts.appView.appendPageView(pv, _.pick(opts, ["$container"]));
        return pv;
    }
    
    function createPageViewES(page, opts) {
        opts = opts || {};

        return page.fetchAnalysis()
                .map(overwritePlotEntry, page.get("plot_url"))
                .doAction(useCaptionAsLabel, page)
                .map(mapToPageView, _.extend(_.pick(opts, ["appView", "createPageView", "$container"]), {
                    model: page,
                    eventBus: opts.appView.eventBus,
                }))
                .doAction(".render")
                .flatMapLatest(toShownES);
    }
    
    
    
    return function(pages, opts) {
        var pageShownESArray = [];
        pages.each(function(page, i) {
            pageShownESArray.push(createPageViewES(page, _.extend(
                    _.pick(opts, ["appView", "createPageView"]), {
                        $container: opts.$containers && opts.$containers.eq(i)
                    }
                )));
        });

        var allPagesShownES = Bacon.combineAsArray(pageShownESArray).take(1);

        allPagesShownES
                .onValue(pages, "trigger", "sync");// simulate sync event
        allPagesShownES
                .filter(opts.appView.model.isEnv("analysis-page-server-static"))
                // if available in full static deployment
                .onValue(opts.appView, "initializeScrollspy");
    }
});