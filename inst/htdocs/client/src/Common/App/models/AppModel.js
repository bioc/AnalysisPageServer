/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";
import config from "config";
import "backbone.localstorage";

export default Backbone.Model.extend({
    localStorage: () => new Backbone.LocalStorage(config["app.model.localStorage"]),
    defaults: {
        nbVisits: 0,
        mode: "simple"
    },
    initialize(attributes) {
        this.fetch();
        this.set(attributes);
        this.save();
    },
    isModeAdvanced() {
        return this.get("mode") === "advanced";
    },
    isModeSimple() {
        return this.get("mode") === "simple";
    },
    setMode(mode) {
        this.set("mode", mode);
        this.save();
    },
    isEnv(env) {
        return this.get("env") === env;
    }
});
