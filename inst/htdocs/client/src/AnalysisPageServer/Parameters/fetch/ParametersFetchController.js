/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import ChildrenCollection from "../models/ParameterChildrenCollection";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:fetch", this.fetch, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:fetch");
    },
    fetch: function(pageModel) {
        var parameters = pageModel.parameters;
        return new Promise(resolve => {
            if (parameters._isFetched) {
                resolve(parameters);
            }
            else if (parameters._isFetching) {
                parameters._fetchPromise.then(() => resolve(parameters));
            }
            else {
                parameters._isFetching = true;
                parameters._fetchPromise = Promise.resolve(parameters.fetch({
                    url: pageModel.rClient.url(parameters.url, pageModel.get("name")),
                    remove: false
                }))
                .then(() => {
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
