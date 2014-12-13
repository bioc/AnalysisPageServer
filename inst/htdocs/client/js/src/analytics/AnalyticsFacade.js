/**
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * This manager acts as a facade and hides implementation details.
 * There may or may not be Google Analytics configured for the app.
 * Also, some other provider may be installed instead.
 */
define(["analytics/GoogleAnalyticsManager"], function(GA) {
    
    var provider = window._gaq && GA;
    
    var m = {
        trackEvent:     function() {
            return provider && provider.trackEvent.apply(provider, arguments);
        },
        setCustomVariable:  function() {
            return provider && provider.setCustomVariable.apply(provider, arguments);
        }
    };
    
    return m;
});