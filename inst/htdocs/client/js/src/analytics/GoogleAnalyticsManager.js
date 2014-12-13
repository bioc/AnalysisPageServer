/**
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 */
define([], function() {
    
    var m = {
        trackEvent:     function() {
            _gaq.push(["_trackEvent"].concat(Array.prototype.slice.call(arguments, 0)));
        },
        setCustomVariable:  function() {
            _gaq.push(["_setCustomVar"].concat(Array.prototype.slice.call(arguments, 0)));
        }
    };
    
    return m;
    
});