/**
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * @returns {undefined}
 */
define(["views/pages/AnalysisPageView", 
    "views/pages/PrimaryPageView",
    "views/pages/LandingPageView"], 
function(AnalysisPageView, PrimaryPageView, LandingPageView) {
    var createPageView = function(opts) {
        opts = _.clone(opts);
        opts.createPageView = createPageView;
        switch (opts.type) {
            case "primary":
                return new PrimaryPageView(opts);
            case "landing":
                return new LandingPageView(opts);
            case "secondary":
            default:
                return new AnalysisPageView(opts);
        }
    };
    return createPageView;
});