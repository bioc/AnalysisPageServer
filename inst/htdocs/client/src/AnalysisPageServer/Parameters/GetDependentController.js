/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:get-dependent-on", this.getDependentOn, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:get-dependent-on");
    },
    getDependentOn: function(parameter) {
        //return [];
        var deps = this._getDependentOn(parameter, [], []);
        return deps;
    },
    _getDependentOn: function(parameter, visited, listSoFar) {
        if (_.indexOf(visited, parameter) > -1) return listSoFar;
        listSoFar = parameter.collection.reduce(function(memo, param) {
            _.each(param.getDependencies(), function(dep) {
                if (dep === parameter && _.indexOf(memo, param) === -1) {
                    // push parameters directly dependent on provided parameter
                    memo.push(param);
                }
            }, this);
            return memo;
        }, listSoFar, this);
        visited.push(parameter);
        _.each(listSoFar, function(dep) {
            listSoFar = this._getDependentOn(dep, visited, listSoFar);
        }, this);
        return listSoFar;
    }
});
