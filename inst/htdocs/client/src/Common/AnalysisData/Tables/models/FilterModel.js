/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Backbone from "backbone";

export default Backbone.Model.extend({
    toReadableFormat:    function() {
        switch (this.get("type")) {
            case "numeric":
            case "integer":
                return this.get("label") +" "+ (this.get("subtype") === "min" ? ">=" : "<=") +" "+ this.get("value");
            default:
                return this.get("label") + " contains "+this.get("value");
        }
    }
});
