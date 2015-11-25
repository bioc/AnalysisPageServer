/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "./PageLocalModel"], function(Backbone, PageLocalModel) {
    var Page = Backbone.Model.extend({
        /**
         * This attribute is transparently mapped to "id".
         * A model with "id" set is considered already created.
         * @type String
         */
        idAttribute:    "name",
        
        initialize:     function(attrs, opts) {
            this.eventBus = opts.eventBus;
            this.initializeLocalModel();
        },
        initializeLocalModel:   function() {
            this.localModel = new PageLocalModel({
                id: this.get("name")
            });
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
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
        sync:           function(method, model, options) {
            if (method === "read") return Backbone.sync.apply(Backbone, arguments);
        }
    });
    return Page;
});