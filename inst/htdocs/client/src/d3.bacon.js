/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Bacon from "bacon";
import d3 from "d3";

export default function(target, eventName, eventTransformer) {
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
