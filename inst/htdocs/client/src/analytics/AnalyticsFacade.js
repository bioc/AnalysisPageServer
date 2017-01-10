/**
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * This manager acts as a facade and hides implementation details.
 * There may or may not be Google Analytics configured for the app.
 * Also, some other provider may be installed instead.
 */
import config from "config";
import gam from "analytics/GoogleAnalyticsManager";

let facade = null;

if (config["analytics.provider"] === "google") {
    facade = gam;
}
else {
    facade = {
        trackEvent: function() {},
        trackPageview: function() {},
        setCustomVariable: function() {}
    };
}

export default facade;
