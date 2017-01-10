/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";

export default function(ParentModel) {
    return [{
            initialize(attrs, opts) {
                ParentModel.prototype.initialize.call(this, attrs, opts);
                this.set("selfDependent", true);
                this.set("externallyDependent", _.size(attrs.dependent) > 1);
                this.on("change:searchTerm", this.onSearchTermChanged);
            },

            setSearchTerm(st, opts) {
                st && st.length > 1 && this.set("searchTerm", st, opts);
            },

            isSearchTermAvailable() {
                return this.get("searchTerm");
            },

            onSearchTermChanged(model, searchTerm, opts) {
                opts.viewTriggered && this.getSuggestions();
            },

            onChangeSuggestions() {

            },
            onFetchSuggestionsFail() {

            }
    }, {}];

};
