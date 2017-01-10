/**
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 */
import config from "config";

let facade = null;

if (config["analytics.provider"] === "google") {

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    if (config["google.analytics.id"]) {
        window.ga("create", config["google.analytics.id"], "auto");
    }

    facade = {
        trackEvent: function(category, action, label, time) {
            window.ga("send", "event", {
                eventCategory: category,
                eventAction: action,
                eventLabel: label,
                eventValue: time
            });
        },
        trackPageview: function(title, hash) {
            window.ga("send", "pageview", {
                title: title,
                page: hash
            });
        },
        setCustomVariable: function(name, value) {
            window.ga("set", name, value);
        }
    };
}
else {

}

export default facade;
