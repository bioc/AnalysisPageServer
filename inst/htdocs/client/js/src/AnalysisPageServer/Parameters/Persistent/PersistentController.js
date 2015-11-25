/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "polyfills/requestAnimationFrame"], 
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("pages:parameters:persistent:update", this.update, this);
        },
        onDestroy: function() {
            this.getCommands().removeHandler("pages:parameters:persistent:update");
        },
        getVent: function() {
            return Backbone.Wreqr.radio.channel("global").vent;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        update: function(pageModel) {
            if (pageModel.get("hidden")) return;
            if (! pageModel.parameters) return;
            if (pageModel.parameters.size() === 0) return;
            var self = this;
            var pageIndex = 0;
            function step() {
                if (pageIndex >= pageModel.collection.size()) return;
                var foreignPageModel = pageModel.collection.at(pageIndex);
                pageIndex++;
                if (! foreignPageModel) {
                    return requestAnimationFrame(step);
                }
                else if (pageModel === foreignPageModel) {
                    return requestAnimationFrame(step);
                }
                else if (! foreignPageModel.parameters) {
                    return requestAnimationFrame(step);
                }
                else {
                    var promise = self.getReqRes().request("parameters:fetch", foreignPageModel);
                    promise.then(function() {
                        self._updateParametersValues(pageModel, foreignPageModel);
                        requestAnimationFrame(step);
                    });
                }
            }
            requestAnimationFrame(step);
        },
        _updateParametersValues: function(sourcePage, foreignPage) {
            var self = this;
            var valueSetPromises = [];
            var affected = _.reduce(sourcePage.parameters.getPersistent(), function(affected, sourceParameter) {
                var foreignParameter = foreignPage.parameters.findWhere({persistent: sourceParameter.get("persistent")});
                if (foreignParameter) {
                    var p = sourceParameter.conditionalToJSON("url")
                        .toPromise()
                        .then(function(json) {
                            return foreignParameter.fromJSON(json);
                        });
                    valueSetPromises.push(p);
                }
                return affected || foreignParameter;
            }, false);
            if (affected && !foreignPage.isDataset()) {
                Promise.all(valueSetPromises).then(function() {
                    return self._persistParametersValues(foreignPage);
                });
            }
        },
        _persistParametersValues: function(foreignPage) {
            return foreignPage.parameters.conditionalToJSON("url")
                    .toPromise()
                    .then(function(json) {
                        return foreignPage.saveParameters(json);
                    });
        }
    });
});