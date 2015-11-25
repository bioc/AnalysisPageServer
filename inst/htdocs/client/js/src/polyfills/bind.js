define(["underscore"], function(_) {
    if (typeof Function.prototype.bind !== "function") {
        Function.prototype.bind = function() {
            return _.bind.apply(null, [this].concat(Array.prototype.slice.call(arguments)));
        };
    }
});