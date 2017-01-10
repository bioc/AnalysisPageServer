import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import Bacon from "bacon";

Backbone.Collection.prototype.getDestroyES =
Backbone.Model.prototype.getDestroyES      =
Marionette.Object.prototype.getDestroyES   =
Marionette.View.prototype.getDestroyES     =
function() {
    return Bacon.fromEvent(this, "destroy");
}
/**
 * Overwritten so that it takes into account possibly defined prototype's
 * template helpers
 */
Marionette.View.prototype.mixinTemplateHelpers = function(target) {
    target = target || {};
    var protoTemplateHelpers = Marionette._getValue(this.templateHelpers, this);
    var templateHelpers = this.getOption('templateHelpers');
    templateHelpers = Marionette._getValue(templateHelpers, this);
    return _.extend(target, templateHelpers, protoTemplateHelpers);
}
