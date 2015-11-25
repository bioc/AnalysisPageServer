/**
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * This manager acts as a facade and hides implementation details.
 * There may or may not be Google Analytics configured for the app.
 * Also, some other provider may be installed instead.
 */
define(function(require) {
    
    var config = require("config");
    
    var gam = require("analytics/GoogleAnalyticsManager");
    
    if (config["analytics.provider"] === "google") {
        return gam;
    }
    else {
        return {
            trackEvent: function() {},
            trackPageview: function() {},
            setCustomVariable: function() {}
        };
    }
});