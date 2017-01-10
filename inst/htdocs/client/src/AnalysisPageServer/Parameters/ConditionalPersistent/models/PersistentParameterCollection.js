/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import config from "config";
import Model from "./PersistentParameterModel";
import "backbone.localstorage";

export default Backbone.Collection.extend({
    model: Model,
    // defer the lookup of collection's localStorage namespace ie. for testing purposes
    // backbone.localstorage uses _.result() to obtain the value of localStorage property
    // so we're safe here
    localStorage: () => new Backbone.LocalStorage(config["parameter.collection.localStorage"])
});
