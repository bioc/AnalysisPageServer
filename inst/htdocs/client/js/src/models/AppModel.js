/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "config", "backbone.localstorage"], function(Backbone, config) {
    var AppModel = Backbone.Model.extend({
        localStorage:   new Backbone.LocalStorage(config["app.model.localStorage"]),
        defaults:   {
            nbVisits:   0,
            mode:       "simple"
        },
        initialize: function(attributes) {
            this.fetch();
            this.set(attributes);
            this.save();
        },
        isModeAdvanced: function() {
            return this.get("mode") === "advanced";
        },
        isModeSimple: function() {
            return this.get("mode") === "simple";
        },
        setMode:   function(mode) {
            this.set("mode", mode);
            this.save();
        },
        isEnv:  function(env) {
            return this.get("env") === env;
        }
    });
    return AppModel;
});