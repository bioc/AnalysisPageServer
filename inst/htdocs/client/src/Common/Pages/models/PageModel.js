/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import PageLocalModel from "./PageLocalModel";

export default Backbone.Model.extend({
    /**
     * This attribute is transparently mapped to "id".
     * A model with "id" set is considered already created.
     * @type String
     */
    idAttribute: "name",

    initialize(attrs, opts) {
        this.initializeLocalModel();
    },
    initializeLocalModel() {
        this.localModel = new PageLocalModel({
            id: this.get("name")
        });
    },
    /**
     * Allow only for READ operations to be done to the server.
     * POSTing doesn't make sense as server doesn't handle this type
     * of communication.
     *
     *
     * @param {String} method
     * @param {PageModel} model
     * @param {Object} options
     * @returns {Promise}
     */
    sync(method, model, options) {
        if (method === "read") return Backbone.sync.apply(Backbone, arguments);
    }
});
