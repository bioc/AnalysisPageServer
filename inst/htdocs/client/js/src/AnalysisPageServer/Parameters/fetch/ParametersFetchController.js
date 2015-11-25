/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../models/ParameterChildrenCollection"], 
function(Marionette, ChildrenCollection) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("parameters:fetch", this.fetch, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        fetch: function(pageModel) {
            var parameters = pageModel.parameters;
            return new Promise(function(resolve) {
                if (parameters._isFetched) {
                    resolve(parameters);
                }
                else if (parameters._isFetching) {
                    parameters._fetchPromise.then(function() { resolve(parameters); });
                }
                else {
                    parameters._isFetching = true;
                    parameters._fetchPromise = Promise.resolve(parameters.fetch({
                        url: pageModel.rClient.url(parameters.url, pageModel.get("name")),
                        remove: false
                    }))
                            .then(function() {
                                pageModel.initializeParameters();
                                pageModel.rootParameters = new ChildrenCollection(
                                        parameters.getRoots()
                                        );
                                parameters._isFetching = false;
                                parameters._isFetched = true;
                                resolve(parameters);
                            });
                }
            });
        }
    });
});