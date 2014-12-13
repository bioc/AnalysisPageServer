/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "d3"], function(Bacon, d3) {
    
    return function(target, eventName, eventTransformer) {
        return Bacon.fromBinder(function(handler) {
            function h() {
                return handler(d3.event);
            }
            target.on(eventName, h);
            return function() {
                return target.on(eventName, null);
            };
        }, eventTransformer);
    };
    
});