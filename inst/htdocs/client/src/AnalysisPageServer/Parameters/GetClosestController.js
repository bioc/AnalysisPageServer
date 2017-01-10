/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:get-closest", this.getClosest, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:get-closest");
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
