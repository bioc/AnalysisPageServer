/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("parameters:get-closest", this.getClosest, this);
        },
        onDestroy: function() {
            this.getReqRes().removeHandler("parameters:get-closest");
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getClosest: function(parameter, whereAttrs) {
            var coll = parameter.collection;
            var parametersWithName = coll.where(whereAttrs);
            if (_.size(parametersWithName) === 1) return _.first(parametersWithName);
            var index = coll.indexOf(parameter);
            // get max number of common parents in the collection
            var maxCommonParents = _.max(_.map(parametersWithName, function(parameterWithName) {
                return _.size(coll.getCommonParents(parameter, parameterWithName));
            }, this));
            var withMaxCommonParents = _.filter(parametersWithName, function(parameterWithName) {
                return _.size(coll.getCommonParents(parameter, parameterWithName)) === maxCommonParents;
            }, this);
//            console.log("getClosestWithName", parametersWithName, maxCommonParents, withMaxCommonParents);
            // now when parameters with provided name and highest number of common
            // parents are elected, sort by index
            // in ascending order
            return _.first(_.sortBy(withMaxCommonParents, function(electedParameter) {
                return Math.abs(index - coll.indexOf(electedParameter));
            }, this));
        }
    });
});